//! Prayer times from the sun's position: the PrayTimes.org method that
//! Aladhan, IslamicFinder and most apps use, with the same conventions
//! (twilight angles per calculation method, Hanafi/standard Asr shadow
//! factor, high-latitude rules).

use chrono::{Datelike, NaiveDate};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Method {
    Karachi,
    Mwl,
    Isna,
    Egypt,
    Makkah,
    Dubai,
    Gulf,
    Kuwait,
    Qatar,
    Singapore,
    Turkey,
    Tehran,
    Jafari,
    France,
    Russia,
}

#[derive(Clone, Copy, Debug)]
pub enum Isha {
    Angle(f64),
    /// Fixed minutes after Maghrib.
    Minutes(f64),
}

pub struct MethodInfo {
    pub id: Method,
    pub name: &'static str,
    pub region: &'static str,
    pub fajr: f64,
    pub isha: Isha,
    /// Sun angle below the horizon for Maghrib; 0 means at sunset.
    pub maghrib: f64,
    /// Midnight halfway between sunset and Fajr (Shia), else sunset and sunrise.
    pub jafari_midnight: bool,
}

pub const METHODS: [MethodInfo; 15] = [
    MethodInfo { id: Method::Karachi, name: "University of Islamic Sciences, Karachi", region: "Bangladesh, Pakistan, India, Afghanistan", fajr: 18.0, isha: Isha::Angle(18.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Mwl, name: "Muslim World League", region: "Europe, Far East, parts of the Americas", fajr: 18.0, isha: Isha::Angle(17.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Isna, name: "Islamic Society of North America", region: "USA, Canada", fajr: 15.0, isha: Isha::Angle(15.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Egypt, name: "Egyptian General Authority of Survey", region: "Africa, Syria, Lebanon, Malaysia", fajr: 19.5, isha: Isha::Angle(17.5), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Makkah, name: "Umm al-Qura University, Makkah", region: "Saudi Arabia", fajr: 18.5, isha: Isha::Minutes(90.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Dubai, name: "Dubai (UAE)", region: "United Arab Emirates", fajr: 18.2, isha: Isha::Angle(18.2), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Gulf, name: "Gulf Region", region: "Gulf countries", fajr: 19.5, isha: Isha::Minutes(90.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Kuwait, name: "Kuwait", region: "Kuwait", fajr: 18.0, isha: Isha::Angle(17.5), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Qatar, name: "Qatar", region: "Qatar", fajr: 18.0, isha: Isha::Minutes(90.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Singapore, name: "Majlis Ugama Islam Singapura", region: "Singapore, Malaysia, Indonesia", fajr: 20.0, isha: Isha::Angle(18.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Turkey, name: "Diyanet İşleri Başkanlığı", region: "Turkey", fajr: 18.0, isha: Isha::Angle(17.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Tehran, name: "Institute of Geophysics, Tehran", region: "Iran", fajr: 17.7, isha: Isha::Angle(14.0), maghrib: 4.5, jafari_midnight: true },
    MethodInfo { id: Method::Jafari, name: "Shia Ithna-Ashari (Qum)", region: "Shia communities", fajr: 16.0, isha: Isha::Angle(14.0), maghrib: 4.0, jafari_midnight: true },
    MethodInfo { id: Method::France, name: "Union des Organisations Islamiques de France", region: "France", fajr: 12.0, isha: Isha::Angle(12.0), maghrib: 0.0, jafari_midnight: false },
    MethodInfo { id: Method::Russia, name: "Spiritual Administration of Muslims of Russia", region: "Russia", fajr: 16.0, isha: Isha::Angle(15.0), maghrib: 0.0, jafari_midnight: false },
];

pub fn method_info(m: Method) -> &'static MethodInfo {
    METHODS.iter().find(|i| i.id == m).unwrap_or(&METHODS[0])
}

/// Asr begins when an object's shadow is its noon shadow plus once (most
/// schools) or twice (Hanafi) its height.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Asr {
    Standard,
    Hanafi,
}

/// How Fajr and Isha are found where twilight never ends in summer.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HighLat {
    None,
    AngleBased,
    MiddleOfNight,
    OneSeventh,
}

pub struct Params {
    pub method: Method,
    pub asr: Asr,
    pub high_lat: HighLat,
}

/// Local clock times in hours (5.5 = 05:30) on the given date. Values past
/// 24 belong to the next day (Isha far north, the last third of the night).
#[derive(Debug, Clone, Copy, Default)]
pub struct DayTimes {
    pub fajr: f64,
    pub sunrise: f64,
    pub dhuhr: f64,
    pub asr: f64,
    pub sunset: f64,
    pub maghrib: f64,
    pub isha: f64,
    /// Islamic midnight, the end of Isha's preferred time.
    pub midnight: f64,
    /// Start of the last third of the night (Maghrib to next Fajr).
    pub last_third: f64,
}

// Degree-based trigonometry.
fn dsin(d: f64) -> f64 {
    d.to_radians().sin()
}
fn dcos(d: f64) -> f64 {
    d.to_radians().cos()
}
fn dtan(d: f64) -> f64 {
    d.to_radians().tan()
}
fn darcsin(x: f64) -> f64 {
    x.asin().to_degrees()
}
fn darccos(x: f64) -> f64 {
    x.acos().to_degrees()
}
fn darctan2(y: f64, x: f64) -> f64 {
    y.atan2(x).to_degrees()
}
fn darccot(x: f64) -> f64 {
    (1.0 / x).atan().to_degrees()
}
fn fix(a: f64, b: f64) -> f64 {
    let a = a - b * (a / b).floor();
    if a < 0.0 {
        a + b
    } else {
        a
    }
}
pub fn fix_angle(a: f64) -> f64 {
    fix(a, 360.0)
}
pub fn fix_hour(a: f64) -> f64 {
    fix(a, 24.0)
}

/// Julian date at 0h UT of a calendar date.
pub fn julian(date: NaiveDate) -> f64 {
    let (mut y, mut m) = (date.year() as f64, date.month() as f64);
    let d = date.day() as f64;
    if m <= 2.0 {
        y -= 1.0;
        m += 12.0;
    }
    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();
    (365.25 * (y + 4716.0)).floor() + (30.6001 * (m + 1.0)).floor() + d + b - 1524.5
}

/// The sun's declination (degrees) and the equation of time (hours) at a
/// Julian date.
pub fn sun_position(jd: f64) -> (f64, f64) {
    let d = jd - 2451545.0;
    let g = fix_angle(357.529 + 0.98560028 * d);
    let q = fix_angle(280.459 + 0.98564736 * d);
    let l = fix_angle(q + 1.915 * dsin(g) + 0.020 * dsin(2.0 * g));
    let e = 23.439 - 0.00000036 * d;
    let ra = darctan2(dcos(e) * dsin(l), dcos(l)) / 15.0;
    let eqt = q / 15.0 - fix_hour(ra);
    let decl = darcsin(dsin(e) * dsin(l));
    (decl, eqt)
}

struct Ctx {
    lat: f64,
    jdate: f64,
}

impl Ctx {
    fn mid_day(&self, time: f64) -> f64 {
        let (_, eqt) = sun_position(self.jdate + time);
        fix_hour(12.0 - eqt)
    }

    /// When the sun is `angle` degrees below the horizon, before noon
    /// (`ccw`) or after it. NaN when it never gets there that day.
    fn sun_angle_time(&self, angle: f64, time: f64, ccw: bool) -> f64 {
        let (decl, _) = sun_position(self.jdate + time);
        let noon = self.mid_day(time);
        let t = darccos((-dsin(angle) - dsin(decl) * dsin(self.lat)) / (dcos(decl) * dcos(self.lat))) / 15.0;
        noon + if ccw { -t } else { t }
    }

    fn asr_time(&self, factor: f64, time: f64) -> f64 {
        let (decl, _) = sun_position(self.jdate + time);
        let angle = -darccot(factor + dtan((self.lat - decl).abs()));
        self.sun_angle_time(angle, time, false)
    }
}

fn time_diff(a: f64, b: f64) -> f64 {
    fix_hour(b - a)
}

/// Prayer times for `date` at a place, in local hours for a UTC offset of
/// `tz` hours.
pub fn compute(date: NaiveDate, lat: f64, lng: f64, elevation: f64, tz: f64, p: &Params) -> DayTimes {
    let m = method_info(p.method);
    let ctx = Ctx { lat, jdate: julian(date) - lng / (15.0 * 24.0) };
    let rise_set = 0.833 + 0.0347 * elevation.max(0.0).sqrt();
    let asr_factor = if p.asr == Asr::Hanafi { 2.0 } else { 1.0 };

    // One refinement pass from rough guesses, as PrayTimes does.
    let portion = |h: f64| h / 24.0;
    let mut t = DayTimes {
        fajr: ctx.sun_angle_time(m.fajr, portion(5.0), true),
        sunrise: ctx.sun_angle_time(rise_set, portion(6.0), true),
        dhuhr: ctx.mid_day(portion(12.0)),
        asr: ctx.asr_time(asr_factor, portion(13.0)),
        sunset: ctx.sun_angle_time(rise_set, portion(18.0), false),
        maghrib: if m.maghrib > 0.0 { ctx.sun_angle_time(m.maghrib, portion(18.0), false) } else { f64::NAN },
        isha: match m.isha {
            Isha::Angle(a) => ctx.sun_angle_time(a, portion(18.0), false),
            Isha::Minutes(_) => f64::NAN,
        },
        ..Default::default()
    };

    let shift = tz - lng / 15.0;
    for v in [&mut t.fajr, &mut t.sunrise, &mut t.dhuhr, &mut t.asr, &mut t.sunset, &mut t.maghrib, &mut t.isha] {
        *v += shift;
    }

    if p.high_lat != HighLat::None {
        let night = time_diff(t.sunset, t.sunrise);
        let part = |angle: f64| -> f64 {
            let ratio = match p.high_lat {
                HighLat::AngleBased => angle / 60.0,
                HighLat::OneSeventh => 1.0 / 7.0,
                _ => 0.5,
            };
            ratio * night
        };
        let fajr_part = part(m.fajr);
        if t.fajr.is_nan() || time_diff(t.fajr, t.sunrise) > fajr_part {
            t.fajr = t.sunrise - fajr_part;
        }
        if let Isha::Angle(a) = m.isha {
            let isha_part = part(a);
            if t.isha.is_nan() || time_diff(t.sunset, t.isha) > isha_part {
                t.isha = t.sunset + isha_part;
            }
        }
        if m.maghrib > 0.0 {
            let mp = part(m.maghrib);
            if t.maghrib.is_nan() || time_diff(t.sunset, t.maghrib) > mp {
                t.maghrib = t.sunset + mp;
            }
        }
    }

    if m.maghrib <= 0.0 {
        t.maghrib = t.sunset;
    }
    if let Isha::Minutes(min) = m.isha {
        t.isha = t.maghrib + min / 60.0;
    }

    t.midnight = if m.jafari_midnight {
        t.sunset + time_diff(t.sunset, t.fajr) / 2.0
    } else {
        t.sunset + time_diff(t.sunset, t.sunrise) / 2.0
    };
    t.last_third = t.maghrib + time_diff(t.maghrib, t.fajr) * 2.0 / 3.0;
    t
}

/// The sun's altitude and azimuth (degrees, azimuth clockwise from north)
/// at a moment given as a Julian date, for a place.
pub fn sun_alt_az(jd_ut: f64, lat: f64, lng: f64) -> (f64, f64) {
    let (decl, eqt) = sun_position(jd_ut);
    let ut_hours = fix_hour((jd_ut + 0.5).fract() * 24.0);
    let solar = ut_hours + lng / 15.0 + eqt;
    let h = 15.0 * (solar - 12.0);
    let alt = darcsin(dsin(lat) * dsin(decl) + dcos(lat) * dcos(decl) * dcos(h));
    let az = fix_angle(darctan2(dsin(h), dcos(h) * dsin(lat) - dtan(decl) * dcos(lat)) + 180.0);
    (alt, az)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hm(h: f64) -> String {
        let m = (fix_hour(h) * 60.0 + 0.5).floor() as i64;
        format!("{:02}:{:02}", m / 60, m % 60)
    }

    #[test]
    fn dhaka_matches_aladhan() {
        // api.aladhan.com, 23 Oct 2026, Dhaka, method 1 (Karachi), Hanafi:
        // Fajr 04:43 Sunrise 05:59 Dhuhr 11:43 Asr 15:49 Maghrib 17:26 Isha 18:42
        let d = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        let p = Params { method: Method::Karachi, asr: Asr::Hanafi, high_lat: HighLat::AngleBased };
        let t = compute(d, 23.8103, 90.4125, 0.0, 6.0, &p);
        let got = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map(hm);
        assert_eq!(got, ["04:43", "05:59", "11:43", "15:49", "17:26", "18:42"]);
        assert_eq!(hm(t.midnight), "23:43");
    }

    #[test]
    fn makkah_isha_minutes() {
        let d = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        let p = Params { method: Method::Makkah, asr: Asr::Standard, high_lat: HighLat::AngleBased };
        let t = compute(d, 21.4225, 39.8262, 0.0, 3.0, &p);
        assert!((t.isha - t.maghrib - 1.5).abs() < 1e-9);
    }

    #[test]
    fn high_latitude_has_times() {
        // Oslo in June: astronomical twilight never ends.
        let d = NaiveDate::from_ymd_opt(2026, 6, 21).unwrap();
        let p = Params { method: Method::Mwl, asr: Asr::Standard, high_lat: HighLat::AngleBased };
        let t = compute(d, 59.91, 10.75, 0.0, 2.0, &p);
        assert!(t.fajr.is_finite() && t.isha.is_finite());
        assert!(t.fajr < t.sunrise && t.isha > t.maghrib);
    }

    #[test]
    fn sun_is_up_at_noon() {
        let d = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        // 06:00 UT is noon-ish in Dhaka.
        let (alt, az) = sun_alt_az(julian(d) + 0.25, 23.81, 90.41);
        assert!(alt > 40.0, "alt {alt}");
        assert!((150.0..210.0).contains(&az), "az {az}");
    }
}
