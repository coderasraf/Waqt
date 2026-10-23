//! The Hijri calendar and the Islamic dates of the year.
//!
//! Months begin from the real new moon (Meeus' algorithm), by one of three
//! rules: Saudi Umm al-Qura (the conjunction happened before sunset in
//! Makkah), local moon sighting (the crescent is old enough at sunset where
//! the user lives to be seen, as South Asian committees decide), or the
//! fixed arithmetic calendar. A day offset lines it up with an official
//! announcement when the sky didn't cooperate.

use chrono::{Datelike, Duration, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::prayer::{self, Asr, HighLat, Method, Params};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Hijri {
    pub year: i32,
    pub month: u32,
    pub day: u32,
}

pub const MONTHS_EN: [&str; 12] = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Ula",
    "Jumada al-Akhirah",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qadah",
    "Dhu al-Hijjah",
];

pub const MONTHS_BN: [&str; 12] = [
    "মুহাররম",
    "সফর",
    "রবিউল আউয়াল",
    "রবিউস সানি",
    "জমাদিউল আউয়াল",
    "জমাদিউস সানি",
    "রজব",
    "শাবান",
    "রমজান",
    "শাওয়াল",
    "জিলকদ",
    "জিলহজ",
];

pub const MONTHS_AR: [&str; 12] = [
    "مُحَرَّم",
    "صَفَر",
    "رَبِيع الأَوَّل",
    "رَبِيع الآخِر",
    "جُمَادَى الأُولَى",
    "جُمَادَى الآخِرَة",
    "رَجَب",
    "شَعْبَان",
    "رَمَضَان",
    "شَوَّال",
    "ذُو القَعْدَة",
    "ذُو الحِجَّة",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Rule {
    /// Saudi Arabia's calendar.
    UmmAlQura,
    /// Predicted crescent sighting at the user's location.
    Sighting,
    /// The fixed 30-year tabular cycle.
    Arithmetic,
}

/// Hours a crescent must have at local sunset to be counted as seen. Fits
/// Bangladesh's announcements for Ramadan, Shawwal 1447 and Safar 1448.
const SIGHTING_HOURS: f64 = 20.0;

const MAKKAH: (f64, f64) = (21.4225, 39.8262);

/// A calendar: a rule, a day offset and the place it is observed from.
#[derive(Debug, Clone, Copy)]
pub struct Cal {
    pub rule: Rule,
    pub offset: i32,
    pub lat: f64,
    pub lng: f64,
}

// ----- New moons (Meeus, Astronomical Algorithms ch. 49) -----

fn dsin(d: f64) -> f64 {
    d.to_radians().sin()
}

/// Julian Ephemeris Day of new moon number `k` (k = 0 is 6 Jan 2000).
pub fn new_moon_jde(k: i64) -> f64 {
    let k = k as f64;
    let t = k / 1236.85;
    let (t2, t3, t4) = (t * t, t * t * t, t * t * t * t);
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.000000150 * t3 + 0.00000000073 * t4;
    let e = 1.0 - 0.002516 * t - 0.0000074 * t2;
    let m = 2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3;
    let mp = 201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4;
    let f = 160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4;
    let om = 124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3;
    let c = -0.40720 * dsin(mp) + 0.17241 * e * dsin(m) + 0.01608 * dsin(2.0 * mp) + 0.01039 * dsin(2.0 * f)
        + 0.00739 * e * dsin(mp - m)
        - 0.00514 * e * dsin(mp + m)
        + 0.00208 * e * e * dsin(2.0 * m)
        - 0.00111 * dsin(mp - 2.0 * f)
        - 0.00057 * dsin(mp + 2.0 * f)
        + 0.00056 * e * dsin(2.0 * mp + m)
        - 0.00042 * dsin(3.0 * mp)
        + 0.00042 * e * dsin(m + 2.0 * f)
        + 0.00038 * e * dsin(m - 2.0 * f)
        - 0.00024 * e * dsin(2.0 * mp - m)
        - 0.00017 * dsin(om)
        - 0.00007 * dsin(mp + 2.0 * m)
        + 0.00004 * dsin(2.0 * mp - 2.0 * f)
        + 0.00004 * dsin(3.0 * m)
        + 0.00003 * dsin(mp + m - 2.0 * f)
        + 0.00003 * dsin(2.0 * mp + 2.0 * f)
        - 0.00003 * dsin(mp + m + 2.0 * f)
        + 0.00003 * dsin(mp - m + 2.0 * f)
        - 0.00002 * dsin(mp - m - 2.0 * f)
        - 0.00002 * dsin(3.0 * mp + m)
        + 0.00002 * dsin(4.0 * mp);
    jde + c
}

/// Unix milliseconds of new moon `k`.
pub fn new_moon_ms(k: i64) -> i64 {
    ((new_moon_jde(k) - 2_440_587.5) * 86_400_000.0) as i64
}

/// Hijri month index (year * 12 + month - 1) that new moon `k` begins:
/// the new moon of 6 Jan 2000 began Shawwal 1420.
const K0_MONTH: i64 = 1420 * 12 + 9;

fn ms_to_date(ms: i64) -> NaiveDate {
    chrono::DateTime::from_timestamp_millis(ms).map(|d| d.date_naive()).unwrap_or_default()
}

/// Sunset (Unix ms) on a date at a place.
fn sunset_ms(date: NaiveDate, lat: f64, lng: f64) -> i64 {
    let p = Params { method: Method::Karachi, asr: Asr::Standard, high_lat: HighLat::AngleBased };
    let t = prayer::compute(date, lat, lng, 0.0, 0.0, &p);
    date.and_hms_opt(0, 0, 0).unwrap_or_default().and_utc().timestamp_millis() + (t.sunset * 3_600_000.0) as i64
}

impl Cal {
    /// The first day (no offset) of the month that new moon `k` begins.
    fn month_start(&self, k: i64) -> NaiveDate {
        let conj = new_moon_ms(k);
        match self.rule {
            Rule::UmmAlQura => {
                // Makkah is at UTC+3.
                let d = ms_to_date(conj + 3 * 3_600_000);
                if conj < sunset_ms(d, MAKKAH.0, MAKKAH.1) {
                    d + Duration::days(1)
                } else {
                    d + Duration::days(2)
                }
            }
            _ => {
                // Local solar date of the conjunction.
                let d = ms_to_date(conj + (self.lng / 15.0 * 3_600_000.0) as i64);
                for i in 0..3 {
                    let day = d + Duration::days(i);
                    let age_h = (sunset_ms(day, self.lat, self.lng) - conj) as f64 / 3_600_000.0;
                    if age_h >= SIGHTING_HOURS {
                        return day + Duration::days(1);
                    }
                }
                d + Duration::days(3)
            }
        }
    }

    /// The Hijri date of a Gregorian day.
    pub fn from_gregorian(&self, date: NaiveDate) -> Hijri {
        let date = date + Duration::days(-self.offset as i64);
        if self.rule == Rule::Arithmetic {
            return arithmetic_from(date);
        }
        let jd = date.num_days_from_ce() as f64 + 1_721_424.5;
        let mut k = ((jd - 2_451_550.1) / 29.530588853).floor() as i64 + 1;
        while self.month_start(k) > date {
            k -= 1;
        }
        while self.month_start(k + 1) <= date {
            k += 1;
        }
        let index = k + K0_MONTH;
        let day = (date - self.month_start(k)).num_days() as u32 + 1;
        Hijri { year: index.div_euclid(12) as i32, month: index.rem_euclid(12) as u32 + 1, day }
    }

    /// The Gregorian day of a Hijri date.
    pub fn to_gregorian(&self, h: Hijri) -> NaiveDate {
        let base = if self.rule == Rule::Arithmetic {
            arithmetic_to(h)
        } else {
            let k = h.year as i64 * 12 + h.month as i64 - 1 - K0_MONTH;
            self.month_start(k) + Duration::days(h.day as i64 - 1)
        };
        base + Duration::days(self.offset as i64)
    }

    pub fn month_length(&self, year: i32, month: u32) -> u32 {
        let start = self.to_gregorian(Hijri { year, month, day: 1 });
        let (ny, nm) = if month == 12 { (year + 1, 1) } else { (year, month + 1) };
        let next = self.to_gregorian(Hijri { year: ny, month: nm, day: 1 });
        (next - start).num_days() as u32
    }

    /// Every event from `from` for the next `days` days, in date order.
    pub fn upcoming(&self, from: NaiveDate, days: i64) -> Vec<(NaiveDate, Hijri, &'static EventDef)> {
        let mut out = Vec::new();
        let mut h = self.from_gregorian(from);
        let mut d = from;
        let end = from + Duration::days(days);
        // Walk month by month rather than converting every day.
        while d < end {
            let len = self.month_length(h.year, h.month);
            for e in EVENTS.iter().filter(|e| e.month == h.month && e.day >= h.day && e.day <= len) {
                let date = d + Duration::days((e.day - h.day) as i64);
                if date < end {
                    out.push((date, Hijri { day: e.day, ..h }, e));
                }
            }
            d += Duration::days((len - h.day + 1) as i64);
            h = if h.month == 12 { Hijri { year: h.year + 1, month: 1, day: 1 } } else { Hijri { month: h.month + 1, day: 1, ..h } };
        }
        out.sort_by_key(|(d, _, _)| *d);
        out
    }
}

// ----- The arithmetic (tabular) calendar -----

fn jdn(date: NaiveDate) -> i64 {
    date.num_days_from_ce() as i64 + 1_721_425
}

fn arithmetic_from(date: NaiveDate) -> Hijri {
    let l = jdn(date) - 1_948_440 + 10_632;
    let n = (l - 1) / 10_631;
    let l = l - 10_631 * n + 354;
    let j = ((10_985 - l) / 5_316) * ((50 * l) / 17_719) + (l / 5_670) * ((43 * l) / 15_238);
    let l = l - ((30 - j) / 15) * ((17_719 * j) / 50) - (j / 16) * ((15_238 * j) / 43) + 29;
    let m = (24 * l) / 709;
    let d = l - (709 * m) / 24;
    let y = 30 * n + j - 30;
    Hijri { year: y as i32, month: m as u32, day: d as u32 }
}

fn arithmetic_to(h: Hijri) -> NaiveDate {
    let (y, m, d) = (h.year as i64, h.month as i64, h.day as i64);
    let jd = (11 * y + 3) / 30 + 354 * y + 30 * m - (m - 1) / 2 + d + 1_948_440 - 385;
    NaiveDate::from_num_days_from_ce_opt((jd - 1_721_425) as i32).unwrap_or_default()
}

// ----- Events -----

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Eid,
    Fast,
    Night,
    Day,
    Season,
}

pub struct EventDef {
    pub month: u32,
    pub day: u32,
    pub key: &'static str,
    pub kind: Kind,
    pub en: &'static str,
    pub bn: &'static str,
    pub ar: &'static str,
    pub note_en: &'static str,
    pub note_bn: &'static str,
}

pub const EVENTS: [EventDef; 14] = [
    EventDef { month: 1, day: 1, key: "new_year", kind: Kind::Day, en: "Islamic New Year", bn: "হিজরি নববর্ষ", ar: "رأس السنة الهجرية", note_en: "The first day of Muharram, one of the four sacred months.", note_bn: "মুহাররমের প্রথম দিন, চারটি সম্মানিত মাসের একটি।" },
    EventDef { month: 1, day: 10, key: "ashura", kind: Kind::Fast, en: "Day of Ashura", bn: "আশুরা", ar: "عاشوراء", note_en: "Fasting is recommended, together with the 9th or 11th.", note_bn: "রোজা রাখা মুস্তাহাব, সাথে ৯ বা ১১ তারিখেও।" },
    EventDef { month: 3, day: 12, key: "mawlid", kind: Kind::Day, en: "Mawlid an-Nabi", bn: "ঈদে মিলাদুন্নবী", ar: "المولد النبوي", note_en: "Commonly observed as the Prophet's ﷺ birthday; a public holiday in Bangladesh.", note_bn: "নবীজি ﷺ এর জন্মদিন হিসেবে পালিত হয়; বাংলাদেশে সরকারি ছুটি।" },
    EventDef { month: 7, day: 27, key: "miraj", kind: Kind::Night, en: "Isra and Mi'raj", bn: "শবে মেরাজ", ar: "الإسراء والمعراج", note_en: "Commemorates the Night Journey. The night begins at Maghrib the evening before.", note_bn: "মেরাজের রাত। আগের দিন মাগরিব থেকে রাত শুরু।" },
    EventDef { month: 8, day: 15, key: "barat", kind: Kind::Night, en: "Mid-Sha'ban (Shab-e-Barat)", bn: "শবে বরাত", ar: "ليلة النصف من شعبان", note_en: "The night of the 15th of Sha'ban, beginning at Maghrib the evening before.", note_bn: "শাবানের ১৫তম রাত; আগের দিন মাগরিব থেকে শুরু।" },
    EventDef { month: 9, day: 1, key: "ramadan", kind: Kind::Season, en: "Ramadan begins", bn: "রমজান শুরু", ar: "بداية رمضان", note_en: "The month of fasting. Taraweeh begins the night before.", note_bn: "রোজার মাস। আগের রাত থেকে তারাবিহ শুরু।" },
    EventDef { month: 9, day: 21, key: "last_ten", kind: Kind::Night, en: "Last ten nights", bn: "শেষ দশক", ar: "العشر الأواخر", note_en: "Seek Laylat al-Qadr in the odd nights: 21, 23, 25, 27, 29.", note_bn: "বেজোড় রাতগুলোতে লাইলাতুল কদর তালাশ করুন: ২১, ২৩, ২৫, ২৭, ২৯।" },
    EventDef { month: 9, day: 27, key: "qadr", kind: Kind::Night, en: "Laylat al-Qadr (27th night)", bn: "শবে কদর", ar: "ليلة القدر", note_en: "Better than a thousand months. Widely observed on the 27th night.", note_bn: "হাজার মাসের চেয়ে উত্তম রাত। সাধারণত ২৭তম রাতে পালিত হয়।" },
    EventDef { month: 10, day: 1, key: "eid_fitr", kind: Kind::Eid, en: "Eid al-Fitr", bn: "ঈদুল ফিতর", ar: "عيد الفطر", note_en: "Fasting is not allowed today. Pay Zakat al-Fitr before the Eid prayer.", note_bn: "আজ রোজা রাখা নিষেধ। ঈদের নামাজের আগে ফিতরা আদায় করুন।" },
    EventDef { month: 10, day: 2, key: "shawwal6", kind: Kind::Fast, en: "Six days of Shawwal", bn: "শাওয়ালের ছয় রোজা", ar: "ست من شوال", note_en: "Fasting six days of Shawwal after Ramadan is like fasting the whole year.", note_bn: "রমজানের পর শাওয়ালের ছয়টি রোজা সারা বছর রোজার সমান।" },
    EventDef { month: 12, day: 1, key: "dhul_hijjah", kind: Kind::Season, en: "First ten days of Dhul Hijjah", bn: "জিলহজের প্রথম দশক", ar: "عشر ذي الحجة", note_en: "The best days of the year for good deeds.", note_bn: "নেক আমলের জন্য বছরের শ্রেষ্ঠ দিন।" },
    EventDef { month: 12, day: 9, key: "arafah", kind: Kind::Fast, en: "Day of Arafah", bn: "আরাফার দিন", ar: "يوم عرفة", note_en: "Fasting expiates the sins of the past and the coming year (for those not on Hajj).", note_bn: "রোজা আগের ও পরের বছরের গুনাহের কাফফারা (হাজি ছাড়া অন্যদের জন্য)।" },
    EventDef { month: 12, day: 10, key: "eid_adha", kind: Kind::Eid, en: "Eid al-Adha", bn: "ঈদুল আজহা", ar: "عيد الأضحى", note_en: "The day of sacrifice. Takbir from Fajr of Arafah until Asr of the 13th.", note_bn: "কুরবানির দিন। আরাফার ফজর থেকে ১৩ তারিখ আসর পর্যন্ত তাকবির।" },
    EventDef { month: 12, day: 11, key: "tashreeq", kind: Kind::Day, en: "Days of Tashreeq", bn: "আইয়ামে তাশরিক", ar: "أيام التشريق", note_en: "11th to 13th Dhul Hijjah: days of eating, drinking and remembrance; no fasting.", note_bn: "১১–১৩ জিলহজ: খাওয়া-দাওয়া ও জিকিরের দিন; রোজা নিষেধ।" },
];

/// Fasting notes for a day, beyond the fixed events: the white days
/// (13–15 of each month) and Mondays and Thursdays.
pub fn sunnah_fasts(date: NaiveDate, h: Hijri) -> Vec<&'static str> {
    let mut out = Vec::new();
    let forbidden = (h.month == 10 && h.day == 1) || (h.month == 12 && (10..=13).contains(&h.day));
    if forbidden {
        return out;
    }
    if (13..=15).contains(&h.day) {
        out.push("white_days");
    }
    match date.weekday() {
        chrono::Weekday::Mon => out.push("monday"),
        chrono::Weekday::Thu => out.push("thursday"),
        _ => {}
    }
    out
}

pub fn events_on(h: Hijri) -> Vec<&'static EventDef> {
    EVENTS.iter().filter(|e| e.month == h.month && e.day == h.day).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn date(y: i32, m: u32, d: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(y, m, d).unwrap()
    }

    const DHAKA: (f64, f64) = (23.8103, 90.4125);

    fn cal(rule: Rule) -> Cal {
        Cal { rule, offset: 0, lat: DHAKA.0, lng: DHAKA.1 }
    }

    #[test]
    fn new_moon_times() {
        // Published new moons: 17 Feb 2026 12:01 UT, 10 Oct 2026 15:50 UT.
        let at = |k: i64| chrono::DateTime::from_timestamp_millis(new_moon_ms(k)).unwrap().format("%Y-%m-%d %H:%M").to_string();
        let k = ((date(2026, 2, 17).num_days_from_ce() as f64 + 1_721_424.5 - 2_451_550.1) / 29.530588853).round() as i64;
        assert!(at(k).starts_with("2026-02-17 12:0") || at(k).starts_with("2026-02-17 11:5"), "{}", at(k));
        assert!(at(k + 8).starts_with("2026-10-10 15:"), "{}", at(k + 8));
    }

    #[test]
    fn umm_al_qura_matches_aladhan() {
        // api.aladhan.com gToH (Umm al-Qura).
        let c = cal(Rule::UmmAlQura);
        assert_eq!(c.from_gregorian(date(2026, 10, 23)), Hijri { year: 1448, month: 5, day: 12 });
        assert_eq!(c.from_gregorian(date(2026, 10, 12)), Hijri { year: 1448, month: 5, day: 1 });
        assert_eq!(c.from_gregorian(date(2026, 8, 14)), Hijri { year: 1448, month: 3, day: 1 });
        assert_eq!(c.from_gregorian(date(2026, 9, 13)), Hijri { year: 1448, month: 4, day: 2 });
        assert_eq!(c.from_gregorian(date(2026, 7, 16)), Hijri { year: 1448, month: 2, day: 2 });
    }

    #[test]
    fn sighting_matches_bangladesh() {
        // Islamic Foundation Bangladesh: Ramadan 1447 began Thu 19 Feb 2026,
        // Eid al-Fitr on 21 Mar 2026, Safar 1448 began 16 Jul 2026.
        let c = cal(Rule::Sighting);
        assert_eq!(c.from_gregorian(date(2026, 2, 19)), Hijri { year: 1447, month: 9, day: 1 });
        assert_eq!(c.from_gregorian(date(2026, 3, 21)), Hijri { year: 1447, month: 10, day: 1 });
        assert_eq!(c.from_gregorian(date(2026, 7, 16)), Hijri { year: 1448, month: 2, day: 1 });
    }

    #[test]
    fn arithmetic_is_tabular() {
        assert_eq!(cal(Rule::Arithmetic).from_gregorian(date(2026, 10, 23)), Hijri { year: 1448, month: 5, day: 11 });
    }

    #[test]
    fn round_trips_and_lengths() {
        for rule in [Rule::UmmAlQura, Rule::Sighting, Rule::Arithmetic] {
            for off in [-1, 0, 1] {
                let c = Cal { offset: off, ..cal(rule) };
                let start = date(2025, 1, 1);
                for i in (0..900).step_by(7) {
                    let d = start + Duration::days(i);
                    assert_eq!(c.to_gregorian(c.from_gregorian(d)), d, "{rule:?} {off} {d}");
                }
                for m in 1..=12 {
                    let len = c.month_length(1448, m);
                    assert!(len == 29 || len == 30, "{rule:?} {m}: {len}");
                }
            }
        }
    }

    #[test]
    fn upcoming_events_are_ordered() {
        let c = cal(Rule::Sighting);
        let list = c.upcoming(date(2026, 10, 23), 385);
        assert!(list.windows(2).all(|w| w[0].0 <= w[1].0));
        assert!(list.iter().any(|(_, _, e)| e.key == "ramadan"));
        // Every event's date really is its Hijri day.
        for (d, h, _) in &list {
            assert_eq!(c.from_gregorian(*d), *h);
        }
    }

    #[test]
    fn no_fasting_on_eid() {
        let h = Hijri { year: 1448, month: 10, day: 1 };
        assert!(sunnah_fasts(date(2027, 3, 10), h).is_empty());
    }
}
