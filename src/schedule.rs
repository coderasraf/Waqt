//! Turns settings and a date into exact prayer moments in the location's
//! time zone, plus the related times (Sehri, Ishraq, forbidden times,
//! Tahajjud) and which prayer is current or next.

use chrono::{DateTime, Duration, NaiveDate, Offset, TimeZone, Utc};
use serde::Serialize;

use crate::config::Config;
use crate::hijri::Cal;
use crate::prayer::{self, Params};

pub const KEYS: [&str; 6] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

#[derive(Debug, Clone, Serialize)]
pub struct Day {
    pub date: NaiveDate,
    /// The location's UTC offset on this date, in minutes.
    pub tz_offset: i32,
    pub fajr: i64,
    pub sunrise: i64,
    pub dhuhr: i64,
    pub asr: i64,
    pub maghrib: i64,
    pub isha: i64,
    pub sunset: i64,
    /// Sehri ends (Fajr minus the precaution minutes).
    pub imsak: i64,
    /// Nafl prayer after sunrise becomes allowed.
    pub ishraq: i64,
    /// Start of the forbidden time just before Dhuhr.
    pub zawal: i64,
    pub midnight: i64,
    pub last_third: i64,
    pub friday: bool,
}

impl Day {
    pub fn get(&self, key: &str) -> i64 {
        match key {
            "fajr" => self.fajr,
            "sunrise" => self.sunrise,
            "dhuhr" => self.dhuhr,
            "asr" => self.asr,
            "maghrib" => self.maghrib,
            "isha" => self.isha,
            "imsak" => self.imsak,
            _ => 0,
        }
    }
}

/// The Hijri calendar as configured, observed from the user's location.
pub fn calendar(cfg: &Config) -> Cal {
    Cal { rule: cfg.calc.hijri_rule, offset: cfg.calc.hijri_offset, lat: cfg.location.lat, lng: cfg.location.lng }
}

/// The time zone of the configured location.
#[derive(Clone, Copy)]
pub enum Zone {
    Named(chrono_tz::Tz),
    System,
}

pub fn zone(cfg: &Config) -> Zone {
    match cfg.location.timezone.parse::<chrono_tz::Tz>() {
        Ok(tz) if !cfg.location.timezone.is_empty() => Zone::Named(tz),
        _ => Zone::System,
    }
}

/// UTC offset in seconds at local noon on `date`.
pub fn offset_secs(z: Zone, date: NaiveDate) -> i32 {
    let noon = date.and_hms_opt(12, 0, 0).unwrap_or_default();
    match z {
        Zone::Named(tz) => tz.offset_from_local_datetime(&noon).earliest().map(|o| o.fix().local_minus_utc()).unwrap_or(0),
        Zone::System => chrono::Local.offset_from_local_datetime(&noon).earliest().map(|o| o.local_minus_utc()).unwrap_or(0),
    }
}

/// Today's date at the location.
pub fn local_date(z: Zone, now: DateTime<Utc>) -> NaiveDate {
    match z {
        Zone::Named(tz) => now.with_timezone(&tz).date_naive(),
        Zone::System => now.with_timezone(&chrono::Local).date_naive(),
    }
}

pub fn day(cfg: &Config, date: NaiveDate) -> Day {
    let z = zone(cfg);
    let off = offset_secs(z, date);
    let l = &cfg.location;
    let p = Params { method: cfg.calc.method, asr: cfg.calc.asr, high_lat: cfg.calc.high_lat };
    let t = prayer::compute(date, l.lat, l.lng, l.elevation, off as f64 / 3600.0, &p);
    let midnight_utc = date.and_hms_opt(0, 0, 0).unwrap_or_default().and_utc().timestamp_millis();
    // Local hours to Unix ms, rounded to the minute like printed timetables.
    let ms = |h: f64, adjust: i32| -> i64 {
        let raw = midnight_utc + ((h * 3600.0 - off as f64) * 1000.0) as i64 + adjust as i64 * 60_000;
        (raw as f64 / 60_000.0).round() as i64 * 60_000
    };
    let o = &cfg.calc.offsets;
    let fajr = ms(t.fajr, o.fajr);
    let sunrise = ms(t.sunrise, o.sunrise);
    let dhuhr = ms(t.dhuhr, o.dhuhr);
    let sunset = ms(t.sunset, 0);
    let maghrib = ms(t.maghrib, o.maghrib);
    Day {
        date,
        tz_offset: off / 60,
        fajr,
        sunrise,
        dhuhr,
        asr: ms(t.asr, o.asr),
        maghrib,
        isha: ms(t.isha, o.isha),
        sunset,
        imsak: fajr - cfg.calc.imsak_minutes as i64 * 60_000,
        ishraq: sunrise + 15 * 60_000,
        zawal: dhuhr - 6 * 60_000,
        midnight: ms(t.midnight, 0),
        last_third: ms(t.last_third, 0),
        friday: chrono::Datelike::weekday(&date) == chrono::Weekday::Fri,
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Moment {
    pub key: &'static str,
    pub at: i64,
}

/// The prayer whose time it is now (None between sunrise and Dhuhr) and
/// the next one, looking across yesterday, today and tomorrow.
pub fn current_and_next(cfg: &Config, now_ms: i64) -> (Option<Moment>, Moment) {
    let z = zone(cfg);
    let now = DateTime::<Utc>::from_timestamp_millis(now_ms).unwrap_or_default();
    let today = local_date(z, now);
    let mut list: Vec<Moment> = Vec::new();
    for d in [today - Duration::days(1), today, today + Duration::days(1)] {
        let day = day(cfg, d);
        for key in KEYS {
            list.push(Moment { key, at: day.get(key) });
        }
    }
    list.sort_by_key(|m| m.at);
    let current = list.iter().rev().find(|m| m.at <= now_ms).cloned().filter(|m| m.key != "sunrise");
    let next = list
        .iter()
        .find(|m| m.at > now_ms && m.key != "sunrise")
        .cloned()
        .unwrap_or(Moment { key: "fajr", at: now_ms });
    (current, next)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dhaka() -> Config {
        Config::default()
    }

    #[test]
    fn dhaka_day_in_local_time() {
        let d = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        let day = day(&dhaka(), d);
        assert_eq!(day.tz_offset, 360);
        let local = |ms: i64| DateTime::<Utc>::from_timestamp_millis(ms + 6 * 3_600_000).unwrap().format("%H:%M").to_string();
        assert_eq!(local(day.fajr), "04:43");
        assert_eq!(local(day.isha), "18:42");
        assert!(day.friday);
    }

    #[test]
    fn current_and_next_prayer() {
        let cfg = dhaka();
        let d = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        let day = day(&cfg, d);
        // Between Asr and Maghrib.
        let (cur, next) = current_and_next(&cfg, day.asr + 60_000);
        assert_eq!(cur.unwrap().key, "asr");
        assert_eq!(next.key, "maghrib");
        // After sunrise there is no current prayer.
        let (cur, next) = current_and_next(&cfg, day.sunrise + 60_000);
        assert!(cur.is_none());
        assert_eq!(next.key, "dhuhr");
        // After Isha, the next is tomorrow's Fajr.
        let (cur, next) = current_and_next(&cfg, day.isha + 3_600_000);
        assert_eq!(cur.unwrap().key, "isha");
        assert_eq!(next.key, "fajr");
        assert!(next.at > day.isha);
    }
}
