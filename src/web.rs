//! The local server behind the window (and `waqt-cli serve`), and the
//! scheduler that sounds the adhan and reminders.

use std::collections::HashSet;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};
use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use axum::extract::{Query, Request, State};
use axum::http::{header, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{Datelike, NaiveDate, Utc};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::astro;
use crate::audio::{Audio, Src, SOUNDS};
use crate::config::{Config, Mode, SehriMode, PRAYERS};
use crate::hijri::{self, EventDef, Hijri};
use crate::online;
use crate::prayer::METHODS;
use crate::schedule::{self, Day};
use crate::store::{self, Store};
use crate::system;
use crate::text;

const INDEX_HTML: &str = include_str!("ui/index.html");
const APP_CSS: &str = include_str!("ui/app.css");
const APP_JS: &str = include_str!("ui/app.js");
const OVERLAY_HTML: &str = include_str!("ui/overlay.html");
const LOGO_PNG: &[u8] = include_bytes!("../assets/icon-256.png");
static FONTS: [(&str, &[u8]); 5] = [
    ("Amiri-Regular.ttf", include_bytes!("ui/fonts/Amiri-Regular.ttf")),
    ("Amiri-Bold.ttf", include_bytes!("ui/fonts/Amiri-Bold.ttf")),
    ("Outfit-Variable.ttf", include_bytes!("ui/fonts/Outfit-Variable.ttf")),
    ("HindSiliguri-Regular.ttf", include_bytes!("ui/fonts/HindSiliguri-Regular.ttf")),
    ("HindSiliguri-SemiBold.ttf", include_bytes!("ui/fonts/HindSiliguri-SemiBold.ttf")),
];

/// An alert is only sounded within this long of its time, so a computer
/// waking from sleep doesn't play an adhan that is long past.
const LATE_LIMIT_MS: i64 = 120_000;

#[cfg(test)]
mod tests {
    use super::*;

    fn keys(cfg: &Config, date: NaiveDate) -> Vec<String> {
        dues(cfg, &schedule::day(cfg, date)).into_iter().map(|d| d.key.split('|').skip(1).collect::<Vec<_>>().join("|")).collect()
    }

    #[test]
    fn alerts_for_a_friday_outside_ramadan() {
        let mut cfg = Config::default();
        cfg.adhan.asr.reminder = 15;
        cfg.adhan.isha.mode = Mode::Off;
        let k = keys(&cfg, NaiveDate::from_ymd_opt(2026, 10, 23).unwrap());
        for want in ["fajr|adhan", "dhuhr|adhan", "asr|adhan", "asr|reminder", "maghrib|adhan", "sunrise-warning", "jumuah"] {
            assert!(k.contains(&want.to_string()), "missing {want} in {k:?}");
        }
        assert!(!k.iter().any(|x| x.starts_with("isha")), "{k:?}");
        assert!(!k.contains(&"sehri".to_string()), "no Sehri alarm outside Ramadan");
    }

    #[test]
    fn sehri_alarm_in_ramadan() {
        let cfg = Config::default();
        // 1 Ramadan 1448 by the default (sighting) calendar.
        let d = schedule::calendar(&cfg).to_gregorian(Hijri { year: 1448, month: 9, day: 1 });
        let all = dues(&cfg, &schedule::day(&cfg, d));
        let sehri = all.iter().find(|x| x.key.ends_with("|sehri")).expect("sehri alarm");
        let day = schedule::day(&cfg, d);
        assert_eq!(sehri.at, day.imsak - 45 * 60_000);
    }
}

/// What the server asks of the desktop window.
pub enum DesktopEvent {
    Show,
    /// The adhan started and the user wants the window to come up.
    Adhan,
    /// Settings changed (the desktop countdown may need to show or hide).
    Config,
}

pub type Hook = Arc<dyn Fn(DesktopEvent) + Send + Sync>;

pub struct App {
    dir: PathBuf,
    config_path: PathBuf,
    config: RwLock<Config>,
    store: Mutex<Store>,
    pub audio: Audio,
    client: reqwest::Client,
    hook: Option<Hook>,
    /// Only the desktop app touches the Windows start-up list.
    desktop: bool,
    fired: Mutex<HashSet<String>>,
    /// The latest adhan, for the window's adhan screen.
    alert: Mutex<Option<Value>>,
}

type AppState = Arc<App>;

#[derive(Debug, Clone, Copy)]
enum Kind {
    Adhan(&'static str),
    Reminder(&'static str, u32),
    SunriseWarning(u32),
    Sehri(u32),
    Jumuah,
    Tahajjud,
}

struct Due {
    key: String,
    at: i64,
    kind: Kind,
}

/// Everything that should sound or notify on a day.
fn dues(cfg: &Config, d: &Day) -> Vec<Due> {
    let date = d.date;
    let mut out = Vec::new();
    for p in PRAYERS {
        let Some(a) = cfg.adhan.get(p) else { continue };
        if a.mode == Mode::Off {
            continue;
        }
        out.push(Due { key: format!("{date}|{p}|adhan"), at: d.get(p), kind: Kind::Adhan(p) });
        if a.reminder > 0 {
            out.push(Due { key: format!("{date}|{p}|reminder"), at: d.get(p) - a.reminder as i64 * 60_000, kind: Kind::Reminder(p, a.reminder) });
        }
    }
    let al = &cfg.alerts;
    if al.sunrise_warning > 0 {
        out.push(Due { key: format!("{date}|sunrise-warning"), at: d.sunrise - al.sunrise_warning as i64 * 60_000, kind: Kind::SunriseWarning(al.sunrise_warning) });
    }
    let ramadan = schedule::calendar(cfg).from_gregorian(date).month == 9;
    if al.sehri == SehriMode::Always || (al.sehri == SehriMode::Ramadan && ramadan) {
        out.push(Due { key: format!("{date}|sehri"), at: d.imsak - al.sehri_minutes as i64 * 60_000, kind: Kind::Sehri(al.sehri_minutes) });
    }
    if al.jumuah && d.friday {
        out.push(Due { key: format!("{date}|jumuah"), at: d.dhuhr - 2 * 3_600_000, kind: Kind::Jumuah });
    }
    if al.tahajjud {
        out.push(Due { key: format!("{date}|tahajjud"), at: d.last_third, kind: Kind::Tahajjud });
    }
    out
}

impl App {
    pub fn new(config: Config, config_path: PathBuf, dir: PathBuf, hook: Option<Hook>, desktop: bool) -> Result<App> {
        let store = Store::open(&dir.join("state.json"));
        let app = App {
            audio: Audio::start(&dir),
            client: online::client()?,
            dir,
            config_path,
            config: RwLock::new(config),
            store: Mutex::new(store),
            hook,
            desktop,
            fired: Mutex::new(HashSet::new()),
            alert: Mutex::new(None),
        };
        // Alerts already past when the app starts (after boot or sleep)
        // stay silent.
        app.mark_past_fired();
        Ok(app)
    }

    pub fn config(&self) -> Config {
        self.config.read().unwrap().clone()
    }

    fn today(&self, cfg: &Config) -> NaiveDate {
        schedule::local_date(schedule::zone(cfg), Utc::now())
    }

    fn days_around(&self, cfg: &Config) -> Vec<Day> {
        let today = self.today(cfg);
        [today - chrono::Duration::days(1), today, today + chrono::Duration::days(1)].iter().map(|d| schedule::day(cfg, *d)).collect()
    }

    fn mark_past_fired(&self) {
        let cfg = self.config();
        let now = Utc::now().timestamp_millis();
        let mut fired = self.fired.lock().unwrap();
        for d in self.days_around(&cfg) {
            for due in dues(&cfg, &d) {
                if due.at <= now {
                    fired.insert(due.key);
                }
            }
        }
    }

    fn tick(&self) {
        let cfg = self.config();
        let now = Utc::now().timestamp_millis();
        let days = self.days_around(&cfg);
        let mut to_fire = Vec::new();
        {
            let mut fired = self.fired.lock().unwrap();
            for d in &days {
                for due in dues(&cfg, d) {
                    if now >= due.at && now - due.at < LATE_LIMIT_MS && !fired.contains(&due.key) {
                        fired.insert(due.key.clone());
                        to_fire.push((due, d.clone()));
                    }
                }
            }
            // Forget keys older than the days we look at.
            let keep: Vec<String> = days.iter().map(|d| d.date.to_string()).collect();
            fired.retain(|k| keep.iter().any(|d| k.starts_with(d.as_str())));
        }
        for (due, day) in to_fire {
            self.fire(&cfg, due.kind, &day);
        }
    }

    fn muted(&self, cfg: &Config) -> bool {
        let today = self.today(cfg).to_string();
        self.store.lock().unwrap().state.muted.as_deref() == Some(today.as_str())
    }

    fn fire(&self, cfg: &Config, kind: Kind, day: &Day) {
        let lang = cfg.language.as_str();
        let bn = lang == "bn";
        let t = |ms: i64| text::time(ms, day.tz_offset, cfg.clock, lang, cfg.bangla_digits);
        let n = |v: u32| text::digits(&v.to_string(), bn && cfg.bangla_digits);
        let muted = self.muted(cfg);
        let ramadan = schedule::calendar(cfg).from_gregorian(day.date).month == 9;
        let vol = cfg.adhan.volume;
        let chime = |src: Src| {
            if !muted {
                self.audio.play(src, vol, false, "reminder");
            }
        };

        let (title, body) = match kind {
            Kind::Adhan(p) => {
                let a = cfg.adhan.get(p).cloned().unwrap_or_default();
                let name = text::prayer(p, lang, day.friday);
                if !muted {
                    match a.mode {
                        Mode::Adhan => {
                            let src = self.audio.resolve(&a.sound).unwrap_or(Src::Builtin(if p == "fajr" { "makkah-fajr" } else { "makkah" }));
                            self.audio.play(src, vol, cfg.adhan.fade_in, p);
                        }
                        Mode::Chime => self.audio.play(Src::Chime, vol, false, p),
                        _ => {}
                    }
                }
                *self.alert.lock().unwrap() = Some(json!({
                    "prayer": p,
                    "at": day.get(p),
                    "friday": day.friday,
                    "ramadan": ramadan,
                    "mode": a.mode,
                    "fired": Utc::now().timestamp_millis(),
                }));
                if a.mode == Mode::Adhan && cfg.adhan.show_window && !muted {
                    if let Some(h) = &self.hook {
                        h(DesktopEvent::Adhan);
                    }
                }
                let title = format!("{name} · {}", text::arabic(p, day.friday));
                let body = match (bn, p == "maghrib" && ramadan) {
                    (false, true) => format!("Iftar time! Maghrib at {}. May Allah accept your fast.", t(day.maghrib)),
                    (true, true) => format!("ইফতারের সময় হয়েছে! মাগরিব {}। আল্লাহ আপনার রোজা কবুল করুন।", t(day.maghrib)),
                    (false, false) => format!("It's time for {name} — {}", t(day.get(p))),
                    (true, false) => format!("{name}-এর ওয়াক্ত হয়েছে — {}", t(day.get(p))),
                };
                (title, body)
            }
            Kind::Reminder(p, m) => {
                chime(Src::Chime);
                let name = text::prayer(p, lang, day.friday);
                if bn {
                    (format!("{name} আসছে"), format!("{name}-এর আর {} মিনিট বাকি ({})", n(m), t(day.get(p))))
                } else {
                    (format!("{name} soon"), format!("{name} in {m} minutes ({})", t(day.get(p))))
                }
            }
            Kind::SunriseWarning(m) => {
                chime(Src::Chime);
                if bn {
                    ("ফজরের সময় শেষ হচ্ছে".into(), format!("ফজরের ওয়াক্ত শেষ হতে {} মিনিট বাকি — সূর্যোদয় {}", n(m), t(day.sunrise)))
                } else {
                    ("Fajr is ending".into(), format!("Fajr ends in {m} minutes — sunrise at {}", t(day.sunrise)))
                }
            }
            Kind::Sehri(m) => {
                chime(Src::Alarm);
                if bn {
                    ("সাহরির সময়".into(), format!("সাহরির শেষ সময় {} — আর {} মিনিট", t(day.imsak), n(m)))
                } else {
                    ("Time for Sehri".into(), format!("Sehri ends at {} — {m} minutes left", t(day.imsak)))
                }
            }
            Kind::Jumuah => {
                chime(Src::Chime);
                if bn {
                    ("জুমা মোবারক".into(), format!("আজ জুমা, {}। সূরা কাহফ পড়ুন ও বেশি বেশি দরুদ পাঠ করুন।", t(day.dhuhr)))
                } else {
                    ("Jumu'ah Mubarak".into(), format!("Jumu'ah today at {}. Read Surah Al-Kahf and send salawat on the Prophet ﷺ.", t(day.dhuhr)))
                }
            }
            Kind::Tahajjud => {
                chime(Src::Chime);
                if bn {
                    ("তাহাজ্জুদ".into(), "রাতের শেষ তৃতীয়াংশ শুরু হয়েছে — তাহাজ্জুদ ও দোয়ার উত্তম সময়।".into())
                } else {
                    ("Tahajjud".into(), "The last third of the night has begun — a blessed time for Tahajjud and du'a.".into())
                }
            }
        };
        let hook = self.hook.clone();
        std::thread::spawn(move || {
            let on_click: Option<Box<dyn Fn() + Send>> = hook.map(|h| Box::new(move || h(DesktopEvent::Show)) as Box<dyn Fn() + Send>);
            system::toast(&title, &body, on_click);
        });
    }

    async fn scheduler(self: Arc<Self>) {
        loop {
            self.tick();
            // Wake just after each second boundary.
            let ms = Utc::now().timestamp_subsec_millis() as u64;
            tokio::time::sleep(Duration::from_millis(1_000 - ms.min(999) + 20)).await;
        }
    }

    /// "Asr 3:49 PM · in 1h 05m", for the tray icon.
    pub fn tray_text(&self) -> String {
        let cfg = self.config();
        let now = Utc::now().timestamp_millis();
        let (_, next) = schedule::current_and_next(&cfg, now);
        let date = schedule::local_date(schedule::zone(&cfg), chrono::DateTime::from_timestamp_millis(next.at).unwrap_or_default());
        let day = schedule::day(&cfg, date);
        let lang = cfg.language.as_str();
        let name = text::prayer(next.key, lang, day.friday);
        let when = text::time(next.at, day.tz_offset, cfg.clock, lang, cfg.bangla_digits);
        let left = text::duration(next.at - now, lang, cfg.bangla_digits);
        let playing = self.audio.playing().is_some();
        match (lang, playing) {
            ("bn", true) => format!("ওয়াক্ত — আজান চলছে · পরবর্তী {name} {when}"),
            ("bn", false) => format!("ওয়াক্ত — পরবর্তী {name} {when} · {left} বাকি"),
            (_, true) => format!("Waqt — adhan playing · next {name} {when}"),
            _ => format!("Waqt — {name} at {when} · in {left}"),
        }
    }

    pub fn set_muted_today(&self, on: bool) {
        let cfg = self.config();
        let today = self.today(&cfg).to_string();
        let mut store = self.store.lock().unwrap();
        store.state.muted = on.then_some(today);
        store.save();
        drop(store);
        if on {
            self.audio.stop();
        }
    }

    /// Turns the desktop countdown on or off, or locks it (click-through).
    pub fn set_overlay(&self, enabled: Option<bool>, locked: Option<bool>) {
        let mut cfg = self.config();
        if let Some(e) = enabled {
            cfg.overlay.enabled = e;
        }
        if let Some(l) = locked {
            cfg.overlay.locked = l;
        }
        if let Err(e) = self.save_config(cfg) {
            eprintln!("saving the countdown setting: {e:#}");
        }
    }

    pub fn is_muted_today(&self) -> bool {
        self.muted(&self.config())
    }

    fn save_config(&self, cfg: Config) -> Result<()> {
        cfg.save(&self.config_path)?;
        if self.desktop {
            if let Err(e) = system::set_autostart(cfg.startup.autostart) {
                eprintln!("autostart: {e:#}");
            }
        }
        *self.config.write().unwrap() = cfg;
        // Times may have moved; anything now in the past must not sound.
        self.mark_past_fired();
        if let Some(h) = &self.hook {
            h(DesktopEvent::Config);
        }
        Ok(())
    }
}

pub struct Server {
    listener: tokio::net::TcpListener,
    app: Router,
    pub state: AppState,
}

impl Server {
    pub async fn bind(config: Config, config_path: PathBuf, dir: PathBuf, port: u16, hook: Option<Hook>, desktop: bool) -> Result<Server> {
        let state = Arc::new(App::new(config, config_path, dir, hook, desktop)?);
        let listener = tokio::net::TcpListener::bind(("127.0.0.1", port))
            .await
            .with_context(|| format!("binding 127.0.0.1:{port}"))?;
        Ok(Server { listener, app: router(state.clone()), state })
    }

    pub fn addr(&self) -> Result<SocketAddr> {
        Ok(self.listener.local_addr()?)
    }

    pub async fn run(self) -> Result<()> {
        tokio::spawn(self.state.clone().scheduler());
        axum::serve(self.listener, self.app).await?;
        Ok(())
    }
}

fn router(state: AppState) -> Router {
    Router::new()
        .route("/", get(|| async { Html(INDEX_HTML) }))
        .route("/app.css", get(|| async { ([(header::CONTENT_TYPE, "text/css")], APP_CSS) }))
        .route("/app.js", get(|| async { ([(header::CONTENT_TYPE, "text/javascript")], APP_JS) }))
        .route("/overlay", get(|| async { Html(OVERLAY_HTML) }))
        .route("/logo.png", get(|| async { ([(header::CONTENT_TYPE, "image/png")], LOGO_PNG) }))
        .route("/fonts/{name}", get(font))
        .route("/api/today", get(today))
        .route("/api/live", get(live))
        .route("/api/month", get(month))
        .route("/api/hmonth", get(hmonth))
        .route("/api/events", get(events))
        .route("/api/qibla", get(qibla))
        .route("/api/settings", get(get_settings).put(put_settings))
        .route("/api/prayer-mode", post(prayer_mode))
        .route("/api/play", post(play))
        .route("/api/stop", post(stop))
        .route("/api/mute", post(mute))
        .route("/api/sounds/import", post(import_sound))
        .route("/api/sounds/delete", post(delete_sound))
        .route("/api/geo/search", get(geo_search))
        .route("/api/geo/detect", get(geo_detect))
        .route("/api/ayah", get(ayah))
        .route("/api/tracker", get(tracker).post(track))
        .route("/api/qada", post(qada))
        .route("/api/tasbih", get(tasbih).post(count))
        .route("/api/export", post(export))
        .route("/api/show", get(show_window))
        .layer(middleware::from_fn(require_local_host))
        .with_state(state)
}

/// Rejects requests whose Host header isn't loopback (DNS rebinding).
async fn require_local_host(req: Request, next: Next) -> Response {
    let host = req.headers().get(header::HOST).and_then(|h| h.to_str().ok()).unwrap_or("");
    let hostname = match host.rsplit_once(':') {
        Some((h, port)) if port.chars().all(|c| c.is_ascii_digit()) => h,
        _ => host,
    };
    if matches!(hostname, "127.0.0.1" | "localhost" | "[::1]") {
        next.run(req).await
    } else {
        (StatusCode::FORBIDDEN, "unexpected Host header").into_response()
    }
}

struct ApiError(StatusCode, anyhow::Error);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": format!("{:#}", self.1) }))).into_response()
    }
}

fn bad(e: impl Into<anyhow::Error>) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, e.into())
}

fn upstream(e: impl Into<anyhow::Error>) -> ApiError {
    ApiError(StatusCode::BAD_GATEWAY, e.into())
}

type ApiResult = Result<Json<Value>, ApiError>;

fn ok() -> ApiResult {
    Ok(Json(json!({ "ok": true })))
}

async fn font(axum::extract::Path(name): axum::extract::Path<String>) -> Response {
    match FONTS.iter().find(|(n, _)| *n == name) {
        Some((_, bytes)) => ([(header::CONTENT_TYPE, "font/ttf"), (header::CACHE_CONTROL, "max-age=31536000")], *bytes).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

// ----- JSON shapes -----

fn hijri_json(h: Hijri) -> Value {
    let i = (h.month.clamp(1, 12) - 1) as usize;
    json!({
        "y": h.year, "m": h.month, "d": h.day,
        "month_en": hijri::MONTHS_EN[i], "month_bn": hijri::MONTHS_BN[i], "month_ar": hijri::MONTHS_AR[i],
    })
}

fn event_json(e: &EventDef) -> Value {
    json!({ "key": e.key, "kind": e.kind, "en": e.en, "bn": e.bn, "ar": e.ar, "note_en": e.note_en, "note_bn": e.note_bn })
}

fn day_json(cal: &hijri::Cal, d: &Day) -> Value {
    let h = cal.from_gregorian(d.date);
    json!({
        "date": d.date,
        "weekday": d.date.weekday().num_days_from_sunday(),
        "tz_offset": d.tz_offset,
        "friday": d.friday,
        "times": {
            "fajr": d.fajr, "sunrise": d.sunrise, "dhuhr": d.dhuhr, "asr": d.asr, "maghrib": d.maghrib, "isha": d.isha,
            "sunset": d.sunset, "imsak": d.imsak, "ishraq": d.ishraq, "zawal": d.zawal, "midnight": d.midnight, "last_third": d.last_third,
        },
        "hijri": hijri_json(h),
        "events": hijri::events_on(h).into_iter().map(event_json).collect::<Vec<_>>(),
        "fasts": hijri::sunnah_fasts(d.date, h),
    })
}

// ----- Handlers -----

async fn today(State(app): State<AppState>) -> ApiResult {
    let cfg = app.config();
    let now = Utc::now().timestamp_millis();
    let today = app.today(&cfg);
    let d0 = schedule::day(&cfg, today);
    let d1 = schedule::day(&cfg, today + chrono::Duration::days(1));
    let (current, next) = schedule::current_and_next(&cfg, now);
    let cal = schedule::calendar(&cfg);

    // The Islamic day begins at Maghrib.
    let after_maghrib = now >= d0.maghrib;
    let hijri_now = cal.from_gregorian(if cfg.calc.hijri_at_maghrib && after_maghrib { d1.date } else { today });

    let h_today = cal.from_gregorian(today);
    let ramadan = if h_today.month == 9 {
        json!({
            "active": true,
            "day": h_today.day,
            "sehri": if now < d0.imsak { d0.imsak } else { d1.imsak },
            "iftar": d0.maghrib,
        })
    } else {
        let start = cal.to_gregorian(Hijri { year: if h_today.month > 9 { h_today.year + 1 } else { h_today.year }, month: 9, day: 1 });
        json!({ "active": false, "starts": start, "days_left": (start - today).num_days() })
    };

    let upcoming: Vec<Value> = cal
        .upcoming(today, 400)
        .into_iter()
        .filter(|(d, _, _)| *d > today)
        .take(6)
        .map(|(d, h, e)| json!({ "date": d, "days_left": (d - today).num_days(), "hijri": hijri_json(h), "event": event_json(e) }))
        .collect();

    let l = &cfg.location;
    let tracker = app.store.lock().unwrap().day(&today.to_string());
    Ok(Json(json!({
        "now": now,
        "today": day_json(&cal, &d0),
        "tomorrow": day_json(&cal, &d1),
        "current": current,
        "next": next,
        "hijri_now": hijri_json(hijri_now),
        "ramadan": ramadan,
        "upcoming": upcoming,
        "moon": astro::moon_phase(now),
        "qibla": { "bearing": astro::qibla_bearing(l.lat, l.lng), "distance": astro::qibla_distance(l.lat, l.lng) },
        "location": l,
        "tracker": tracker,
        "method": crate::prayer::method_info(cfg.calc.method).name,
        "asr": cfg.calc.asr,
    })))
}

async fn live(State(app): State<AppState>) -> ApiResult {
    let alert = app.alert.lock().unwrap().clone();
    // The adhan screen is offered for 15 minutes after the adhan.
    let alert = alert.filter(|a| Utc::now().timestamp_millis() - a["fired"].as_i64().unwrap_or(0) < 15 * 60_000);
    Ok(Json(json!({
        "now": Utc::now().timestamp_millis(),
        "playing": app.audio.playing(),
        "alert": alert,
        "muted": app.is_muted_today(),
    })))
}

#[derive(Deserialize)]
struct MonthQuery {
    y: Option<i32>,
    m: Option<u32>,
}

async fn month(State(app): State<AppState>, Query(q): Query<MonthQuery>) -> ApiResult {
    let cfg = app.config();
    let today = app.today(&cfg);
    let (y, m) = (q.y.unwrap_or(today.year()), q.m.unwrap_or(today.month()));
    let first = NaiveDate::from_ymd_opt(y, m, 1).ok_or_else(|| bad(anyhow!("no such month")))?;
    let cal = schedule::calendar(&cfg);
    let days: Vec<Value> = first
        .iter_days()
        .take_while(|d| d.month() == m)
        .map(|d| day_json(&cal, &schedule::day(&cfg, d)))
        .collect();
    Ok(Json(json!({ "y": y, "m": m, "today": today, "days": days })))
}

async fn hmonth(State(app): State<AppState>, Query(q): Query<MonthQuery>) -> ApiResult {
    let cfg = app.config();
    let cal = schedule::calendar(&cfg);
    let today = app.today(&cfg);
    let ht = cal.from_gregorian(today);
    let (y, m) = (q.y.unwrap_or(ht.year), q.m.unwrap_or(ht.month));
    if !(1..=12).contains(&m) || !(1300..=1600).contains(&y) {
        return Err(bad(anyhow!("no such Hijri month")));
    }
    let len = cal.month_length(y, m);
    let first = cal.to_gregorian(Hijri { year: y, month: m, day: 1 });
    let days: Vec<Value> = (1..=len)
        .map(|d| {
            let h = Hijri { year: y, month: m, day: d };
            let g = first + chrono::Duration::days(d as i64 - 1);
            let noon = g.and_hms_opt(12, 0, 0).unwrap_or_default().and_utc().timestamp_millis();
            json!({
                "d": d,
                "date": g,
                "weekday": g.weekday().num_days_from_sunday(),
                "today": g == today,
                "events": hijri::events_on(h).into_iter().map(event_json).collect::<Vec<_>>(),
                "fasts": hijri::sunnah_fasts(g, h),
                "moon": astro::moon_phase(noon),
            })
        })
        .collect();
    Ok(Json(json!({
        "y": y, "m": m, "length": len, "first": first,
        "first_weekday": first.weekday().num_days_from_sunday(),
        "names": hijri_json(Hijri { year: y, month: m, day: 1 }),
        "days": days,
        "today_hijri": hijri_json(ht),
    })))
}

async fn events(State(app): State<AppState>) -> ApiResult {
    let cfg = app.config();
    let today = app.today(&cfg);
    let list: Vec<Value> = schedule::calendar(&cfg)
        .upcoming(today, 385)
        .into_iter()
        .map(|(d, h, e)| json!({ "date": d, "days_left": (d - today).num_days(), "weekday": d.weekday().num_days_from_sunday(), "hijri": hijri_json(h), "event": event_json(e) }))
        .collect();
    Ok(Json(json!({ "events": list, "offset": cfg.calc.hijri_offset })))
}

async fn qibla(State(app): State<AppState>) -> ApiResult {
    let cfg = app.config();
    let l = &cfg.location;
    let d = schedule::day(&cfg, app.today(&cfg));
    let now = Utc::now().timestamp_millis();
    let (alt, az) = crate::prayer::sun_alt_az(now as f64 / 86_400_000.0 + 2_440_587.5, l.lat, l.lng);
    Ok(Json(json!({
        "bearing": astro::qibla_bearing(l.lat, l.lng),
        "distance": astro::qibla_distance(l.lat, l.lng),
        "alignments": astro::sun_alignments(l.lat, l.lng, d.sunrise, d.sunset),
        "sun": { "altitude": alt, "azimuth": az },
        "sunrise": d.sunrise, "sunset": d.sunset, "tz_offset": d.tz_offset,
        "location": l,
    })))
}

fn sounds_json(app: &App) -> Vec<Value> {
    let mut list: Vec<Value> = SOUNDS
        .iter()
        .map(|s| json!({ "id": s.id, "name": s.name, "name_bn": s.name_bn, "fajr": s.fajr, "custom": false }))
        .collect();
    if let Ok(entries) = std::fs::read_dir(app.audio.sounds_dir()) {
        let mut custom: Vec<String> = entries.flatten().map(|e| e.file_name().to_string_lossy().to_string()).collect();
        custom.sort();
        for name in custom {
            let label = name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&name).to_string();
            list.push(json!({ "id": format!("custom:{name}"), "name": label, "name_bn": label, "fajr": false, "custom": true }));
        }
    }
    list
}

async fn get_settings(State(app): State<AppState>) -> ApiResult {
    let methods: Vec<Value> = METHODS
        .iter()
        .map(|m| {
            let isha = match m.isha {
                crate::prayer::Isha::Angle(a) => format!("{a}°"),
                crate::prayer::Isha::Minutes(min) => format!("{min} min"),
            };
            json!({ "id": m.id, "name": m.name, "region": m.region, "fajr": m.fajr, "isha": isha })
        })
        .collect();
    Ok(Json(json!({
        "config": app.config(),
        "methods": methods,
        "sounds": sounds_json(&app),
        "data_dir": app.dir.display().to_string(),
        "desktop": app.desktop,
    })))
}

async fn put_settings(State(app): State<AppState>, Json(cfg): Json<Config>) -> ApiResult {
    app.save_config(cfg).map_err(bad)?;
    ok()
}

#[derive(Deserialize)]
struct ModeRequest {
    prayer: String,
    mode: Mode,
}

async fn prayer_mode(State(app): State<AppState>, Json(r): Json<ModeRequest>) -> ApiResult {
    let mut cfg = app.config();
    let a = cfg.adhan.get_mut(&r.prayer).ok_or_else(|| bad(anyhow!("unknown prayer")))?;
    a.mode = r.mode;
    app.save_config(cfg).map_err(bad)?;
    ok()
}

#[derive(Deserialize)]
struct PlayRequest {
    sound: String,
    #[serde(default)]
    volume: Option<u32>,
}

async fn play(State(app): State<AppState>, Json(r): Json<PlayRequest>) -> ApiResult {
    let src = app.audio.resolve(&r.sound).ok_or_else(|| bad(anyhow!("unknown sound")))?;
    let cfg = app.config();
    app.audio.play(src, r.volume.unwrap_or(cfg.adhan.volume), false, "test");
    ok()
}

async fn stop(State(app): State<AppState>) -> ApiResult {
    app.audio.stop();
    ok()
}

#[derive(Deserialize)]
struct OnRequest {
    on: bool,
}

async fn mute(State(app): State<AppState>, Json(r): Json<OnRequest>) -> ApiResult {
    app.set_muted_today(r.on);
    ok()
}

async fn import_sound(State(app): State<AppState>) -> ApiResult {
    let picked = tokio::task::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("Choose an adhan recording")
            .add_filter("Audio", &["mp3", "wav", "ogg", "flac"])
            .pick_file()
    })
    .await
    .map_err(bad)?;
    let Some(path) = picked else { return Ok(Json(json!({ "cancelled": true }))) };
    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let clean: String = name.chars().map(|c| if c.is_control() || "<>:\"/\\|?*".contains(c) { '_' } else { c }).collect();
    let dir = app.audio.sounds_dir().to_path_buf();
    std::fs::create_dir_all(&dir).map_err(bad)?;
    std::fs::copy(&path, dir.join(&clean)).with_context(|| format!("copying {}", path.display())).map_err(bad)?;
    Ok(Json(json!({ "id": format!("custom:{clean}"), "sounds": sounds_json(&app) })))
}

#[derive(Deserialize)]
struct IdRequest {
    id: String,
}

async fn delete_sound(State(app): State<AppState>, Json(r): Json<IdRequest>) -> ApiResult {
    let name = r.id.strip_prefix("custom:").ok_or_else(|| bad(anyhow!("only your own sounds can be removed")))?;
    if name.contains(['/', '\\']) || name.contains("..") {
        return Err(bad(anyhow!("bad sound name")));
    }
    let _ = std::fs::remove_file(app.audio.sounds_dir().join(name));
    // Prayers using it fall back to the default recording.
    let mut cfg = app.config();
    for p in PRAYERS {
        if let Some(a) = cfg.adhan.get_mut(p) {
            if a.sound == r.id {
                a.sound = if p == "fajr" { "makkah-fajr".into() } else { "makkah".into() };
            }
        }
    }
    app.save_config(cfg).map_err(bad)?;
    Ok(Json(json!({ "sounds": sounds_json(&app) })))
}

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
}

async fn geo_search(State(app): State<AppState>, Query(q): Query<SearchQuery>) -> ApiResult {
    let lang = app.config().language;
    let places = online::search_places(&app.client, &q.q, &lang).await.map_err(upstream)?;
    let list: Vec<Value> = places
        .into_iter()
        .map(|p| {
            let (m, a) = online::recommend(&p.country_code);
            json!({ "rule": online::recommend_rule(&p.country_code), "place": p, "method": m, "asr": a })
        })
        .collect();
    Ok(Json(json!({ "results": list })))
}

async fn geo_detect(State(app): State<AppState>) -> ApiResult {
    let p = online::detect(&app.client).await.map_err(upstream)?;
    let (m, a) = online::recommend(&p.country_code);
    Ok(Json(json!({ "rule": online::recommend_rule(&p.country_code), "place": p, "method": m, "asr": a })))
}

async fn ayah(State(app): State<AppState>) -> ApiResult {
    let cfg = app.config();
    let a = online::ayah_of_day(&app.client, &app.dir.join("cache"), app.today(&cfg)).await.map_err(upstream)?;
    Ok(Json(json!(a)))
}

#[derive(Deserialize)]
struct TrackerQuery {
    days: Option<i64>,
}

async fn tracker(State(app): State<AppState>, Query(q): Query<TrackerQuery>) -> ApiResult {
    let cfg = app.config();
    let today = app.today(&cfg);
    let days = q.days.unwrap_or(182).clamp(7, 800);
    let store = app.store.lock().unwrap();
    let mut out = serde_json::Map::new();
    for i in 0..days {
        let d = (today - chrono::Duration::days(i)).to_string();
        if let Some(s) = store.state.tracker.get(&d) {
            out.insert(d, json!(s));
        }
    }
    Ok(Json(json!({
        "today": today,
        "days": out,
        "stats": store::stats(&store.state, today),
        "qada_done": store.state.qada_done,
    })))
}

#[derive(Deserialize)]
struct TrackRequest {
    date: NaiveDate,
    prayer: usize,
    status: u8,
}

async fn track(State(app): State<AppState>, Json(r): Json<TrackRequest>) -> ApiResult {
    let cfg = app.config();
    if r.date > app.today(&cfg) {
        return Err(bad(anyhow!("that day hasn't come yet")));
    }
    let mut store = app.store.lock().unwrap();
    store.set_prayer(&r.date.to_string(), r.prayer, r.status);
    store.save();
    Ok(Json(json!({ "day": store.day(&r.date.to_string()), "stats": store::stats(&store.state, app.today(&cfg)) })))
}

#[derive(Deserialize)]
struct QadaRequest {
    delta: i32,
}

async fn qada(State(app): State<AppState>, Json(r): Json<QadaRequest>) -> ApiResult {
    let cfg = app.config();
    let mut store = app.store.lock().unwrap();
    let v = (store.state.qada_done as i64 + r.delta as i64).max(0) as u32;
    store.state.qada_done = v;
    store.save();
    Ok(Json(json!({ "stats": store::stats(&store.state, app.today(&cfg)) })))
}

async fn tasbih(State(app): State<AppState>) -> ApiResult {
    let cfg = app.config();
    let today = app.today(&cfg).to_string();
    let store = app.store.lock().unwrap();
    let t = &store.state.tasbih;
    let recent: Vec<Value> = t.daily.iter().rev().take(30).map(|(d, n)| json!({ "date": d, "count": n })).collect();
    Ok(Json(json!({ "totals": t.totals, "today": t.daily.get(&today).copied().unwrap_or(0), "recent": recent })))
}

#[derive(Deserialize)]
struct CountRequest {
    id: String,
    n: u64,
}

async fn count(State(app): State<AppState>, Json(r): Json<CountRequest>) -> ApiResult {
    if r.id.len() > 40 || r.n > 10_000 {
        return Err(bad(anyhow!("bad tasbih count")));
    }
    let cfg = app.config();
    let today = app.today(&cfg).to_string();
    let mut store = app.store.lock().unwrap();
    store.add_tasbih(&r.id, &today, r.n);
    store.save();
    ok()
}

#[derive(Deserialize)]
struct ExportRequest {
    y: i32,
    m: u32,
}

/// Saves a month's timetable as CSV (opens in Excel).
async fn export(State(app): State<AppState>, Json(r): Json<ExportRequest>) -> ApiResult {
    let cfg = app.config();
    let first = NaiveDate::from_ymd_opt(r.y, r.m, 1).ok_or_else(|| bad(anyhow!("no such month")))?;
    let cal = schedule::calendar(&cfg);
    let mut csv = String::from("\u{feff}Date,Day,Hijri,Sehri ends,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n");
    for d in first.iter_days().take_while(|d| d.month() == r.m) {
        let day = schedule::day(&cfg, d);
        let h = cal.from_gregorian(d);
        let t = |ms: i64| text::time(ms, day.tz_offset, 24, "en", false);
        csv.push_str(&format!(
            "{},{},{} {} {},{},{},{},{},{},{},{}\n",
            d,
            d.format("%a"),
            h.day,
            hijri::MONTHS_EN[(h.month - 1) as usize],
            h.year,
            t(day.imsak),
            t(day.fajr),
            t(day.sunrise),
            t(day.dhuhr),
            t(day.asr),
            t(day.maghrib),
            t(day.isha)
        ));
    }
    let name = format!("Prayer times {} {}.csv", cfg.location.name, first.format("%B %Y"));
    let picked = tokio::task::spawn_blocking(move || {
        rfd::FileDialog::new().set_title("Save the timetable").set_file_name(&name).add_filter("CSV (Excel)", &["csv"]).save_file()
    })
    .await
    .map_err(bad)?;
    let Some(path) = picked else { return Ok(Json(json!({ "cancelled": true }))) };
    std::fs::write(&path, csv).with_context(|| format!("writing {}", path.display())).map_err(bad)?;
    Ok(Json(json!({ "path": path.display().to_string() })))
}

/// A second copy of the app calls this to bring the running one forward.
async fn show_window(State(app): State<AppState>) -> ApiResult {
    if let Some(h) = &app.hook {
        h(DesktopEvent::Show);
    }
    ok()
}
