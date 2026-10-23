//! Settings, kept in config.toml: location, calculation, adhan per prayer,
//! reminders and startup behaviour.

use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use crate::hijri::Rule;
use crate::prayer::{Asr, HighLat, Method};

pub const PRAYERS: [&str; 5] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Field order matters for saving: TOML needs plain values before tables.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    /// en or bn.
    pub language: String,
    /// 12 or 24.
    pub clock: u8,
    /// Bangla digits (০১২…) when the language is Bangla.
    pub bangla_digits: bool,
    /// False until the first-run setup is finished.
    pub onboarded: bool,
    pub location: Location,
    pub calc: Calc,
    pub adhan: Adhan,
    pub alerts: Alerts,
    pub startup: Startup,
    /// The floating countdown on the desktop.
    pub overlay: Overlay,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            language: "en".into(),
            clock: 12,
            bangla_digits: true,
            onboarded: false,
            location: Location::default(),
            calc: Calc::default(),
            adhan: Adhan::default(),
            alerts: Alerts::default(),
            startup: Startup::default(),
            overlay: Overlay::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Location {
    pub name: String,
    pub country: String,
    pub country_code: String,
    pub lat: f64,
    pub lng: f64,
    pub elevation: f64,
    /// IANA zone such as Asia/Dhaka; empty means the computer's own.
    pub timezone: String,
}

impl Default for Location {
    fn default() -> Self {
        Location {
            name: "Dhaka".into(),
            country: "Bangladesh".into(),
            country_code: "BD".into(),
            lat: 23.8103,
            lng: 90.4125,
            elevation: 0.0,
            timezone: "Asia/Dhaka".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Calc {
    pub method: Method,
    pub asr: Asr,
    pub high_lat: HighLat,
    /// Minutes added to each time, for local timetables that differ.
    pub offsets: Offsets,
    /// How Hijri months begin: Umm al-Qura, local sighting or arithmetic.
    pub hijri_rule: Rule,
    /// Days added to the calculated Hijri date to match an announcement.
    pub hijri_offset: i32,
    /// Advance the Hijri date at Maghrib, when the Islamic day begins.
    pub hijri_at_maghrib: bool,
    /// Sehri ends this many minutes before Fajr begins (precaution).
    pub imsak_minutes: u32,
}

impl Default for Calc {
    fn default() -> Self {
        Calc {
            method: Method::Karachi,
            asr: Asr::Hanafi,
            high_lat: HighLat::AngleBased,
            offsets: Offsets::default(),
            hijri_rule: Rule::Sighting,
            hijri_offset: 0,
            hijri_at_maghrib: false,
            imsak_minutes: 0,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Offsets {
    pub fajr: i32,
    pub sunrise: i32,
    pub dhuhr: i32,
    pub asr: i32,
    pub maghrib: i32,
    pub isha: i32,
}

impl Offsets {
    pub fn get(&self, key: &str) -> i32 {
        match key {
            "fajr" => self.fajr,
            "sunrise" => self.sunrise,
            "dhuhr" => self.dhuhr,
            "asr" => self.asr,
            "maghrib" => self.maghrib,
            "isha" => self.isha,
            _ => 0,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    /// Full adhan.
    Adhan,
    /// A soft chime and a notification.
    Chime,
    /// Notification only.
    Notify,
    Off,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct PrayerAlert {
    pub mode: Mode,
    /// Adhan recording id (see audio::SOUNDS) or custom:<file>.
    pub sound: String,
    /// Remind this many minutes before; 0 for no reminder.
    pub reminder: u32,
}

impl Default for PrayerAlert {
    fn default() -> Self {
        PrayerAlert { mode: Mode::Adhan, sound: "makkah".into(), reminder: 0 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Adhan {
    /// 0 to 100.
    pub volume: u32,
    /// Start quietly and rise over a few seconds.
    pub fade_in: bool,
    /// Bring the window up with the adhan screen.
    pub show_window: bool,
    pub fajr: PrayerAlert,
    pub dhuhr: PrayerAlert,
    pub asr: PrayerAlert,
    pub maghrib: PrayerAlert,
    pub isha: PrayerAlert,
}

impl Default for Adhan {
    fn default() -> Self {
        Adhan {
            volume: 80,
            fade_in: true,
            show_window: true,
            fajr: PrayerAlert { sound: "makkah-fajr".into(), ..Default::default() },
            dhuhr: PrayerAlert::default(),
            asr: PrayerAlert::default(),
            maghrib: PrayerAlert::default(),
            isha: PrayerAlert::default(),
        }
    }
}

impl Adhan {
    pub fn get(&self, prayer: &str) -> Option<&PrayerAlert> {
        match prayer {
            "fajr" => Some(&self.fajr),
            "dhuhr" => Some(&self.dhuhr),
            "asr" => Some(&self.asr),
            "maghrib" => Some(&self.maghrib),
            "isha" => Some(&self.isha),
            _ => None,
        }
    }

    pub fn get_mut(&mut self, prayer: &str) -> Option<&mut PrayerAlert> {
        match prayer {
            "fajr" => Some(&mut self.fajr),
            "dhuhr" => Some(&mut self.dhuhr),
            "asr" => Some(&mut self.asr),
            "maghrib" => Some(&mut self.maghrib),
            "isha" => Some(&mut self.isha),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SehriMode {
    Off,
    Ramadan,
    Always,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Alerts {
    /// Warn this many minutes before sunrise that Fajr is ending; 0 = off.
    pub sunrise_warning: u32,
    pub sehri: SehriMode,
    /// Sehri alarm this many minutes before Fajr.
    pub sehri_minutes: u32,
    /// Friday morning reminder: Jumu'ah time and Surah Al-Kahf.
    pub jumuah: bool,
    /// A gentle reminder when the last third of the night begins.
    pub tahajjud: bool,
}

impl Default for Alerts {
    fn default() -> Self {
        Alerts { sunrise_warning: 20, sehri: SehriMode::Ramadan, sehri_minutes: 45, jumuah: true, tahajjud: false }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Startup {
    /// Start with Windows (minimized to the tray).
    pub autostart: bool,
    /// The close button hides to the tray, so adhan keeps working.
    pub close_to_tray: bool,
}

impl Default for Startup {
    fn default() -> Self {
        Startup { autostart: true, close_to_tray: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Overlay {
    /// Show the next-prayer countdown on the desktop, even with Waqt's
    /// window closed.
    pub enabled: bool,
    /// Clicks pass through it, so it never gets in the way.
    pub locked: bool,
}

impl Default for Overlay {
    fn default() -> Self {
        Overlay { enabled: true, locked: false }
    }
}

impl Config {
    pub fn load(path: &Path) -> Result<Config> {
        let text = std::fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))?;
        let cfg: Config = toml::from_str(&text).with_context(|| format!("parsing {}", path.display()))?;
        cfg.validate()?;
        Ok(cfg)
    }

    pub fn load_or_create(path: &Path) -> Result<Config> {
        if path.exists() {
            return Config::load(path);
        }
        let cfg = Config::default();
        cfg.save(path)?;
        Ok(cfg)
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        self.validate()?;
        let text = toml::to_string_pretty(self)?;
        let tmp = path.with_extension("toml.tmp");
        std::fs::write(&tmp, text).with_context(|| format!("writing {}", tmp.display()))?;
        std::fs::rename(&tmp, path).with_context(|| format!("replacing {}", path.display()))?;
        Ok(())
    }

    pub fn validate(&self) -> Result<()> {
        if !["en", "bn"].contains(&self.language.as_str()) {
            bail!("language must be en or bn");
        }
        if ![12, 24].contains(&self.clock) {
            bail!("clock must be 12 or 24");
        }
        let l = &self.location;
        if !(-90.0..=90.0).contains(&l.lat) || !(-180.0..=180.0).contains(&l.lng) {
            bail!("the location's coordinates are out of range");
        }
        if !l.timezone.is_empty() && l.timezone.parse::<chrono_tz::Tz>().is_err() {
            bail!("unknown time zone {:?}", l.timezone);
        }
        if self.calc.hijri_offset.abs() > 3 {
            bail!("the Hijri adjustment must be between -3 and 3 days");
        }
        if self.calc.imsak_minutes > 30 {
            bail!("the Sehri precaution must be 30 minutes or less");
        }
        for v in [self.calc.offsets.fajr, self.calc.offsets.sunrise, self.calc.offsets.dhuhr, self.calc.offsets.asr, self.calc.offsets.maghrib, self.calc.offsets.isha] {
            if v.abs() > 60 {
                bail!("time adjustments must be within 60 minutes");
            }
        }
        if self.adhan.volume > 100 {
            bail!("volume must be 0 to 100");
        }
        Ok(())
    }
}

pub fn data_dir() -> PathBuf {
    std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from))
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Waqt")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_round_trips() {
        let text = toml::to_string_pretty(&Config::default()).unwrap();
        let back: Config = toml::from_str(&text).unwrap();
        assert!(back.validate().is_ok());
        assert_eq!(back.adhan.fajr.sound, "makkah-fajr");
        assert_eq!(back.calc.method, Method::Karachi);
    }

    #[test]
    fn rejects_bad_zone() {
        let mut c = Config::default();
        c.location.timezone = "Mars/Olympus".into();
        assert!(c.validate().is_err());
    }
}
