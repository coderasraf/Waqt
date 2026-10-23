//! Words the app says outside its window (notifications, tray), in English
//! and Bangla, and time formatting for them.

pub fn prayer(key: &str, lang: &str, friday: bool) -> &'static str {
    let bn = lang == "bn";
    match (key, bn) {
        ("fajr", false) => "Fajr",
        ("fajr", true) => "ফজর",
        ("sunrise", false) => "Sunrise",
        ("sunrise", true) => "সূর্যোদয়",
        ("dhuhr", false) if friday => "Jumu'ah",
        ("dhuhr", true) if friday => "জুমা",
        ("dhuhr", false) => "Dhuhr",
        ("dhuhr", true) => "যোহর",
        ("asr", false) => "Asr",
        ("asr", true) => "আসর",
        ("maghrib", false) => "Maghrib",
        ("maghrib", true) => "মাগরিব",
        ("isha", false) => "Isha",
        ("isha", true) => "এশা",
        _ => "",
    }
}

pub fn arabic(key: &str, friday: bool) -> &'static str {
    match key {
        "fajr" => "الفجر",
        "sunrise" => "الشروق",
        "dhuhr" if friday => "الجمعة",
        "dhuhr" => "الظهر",
        "asr" => "العصر",
        "maghrib" => "المغرب",
        "isha" => "العشاء",
        _ => "",
    }
}

pub fn digits(s: &str, bangla: bool) -> String {
    if !bangla {
        return s.to_string();
    }
    s.chars()
        .map(|c| match c {
            '0'..='9' => char::from_u32('০' as u32 + (c as u32 - '0' as u32)).unwrap_or(c),
            _ => c,
        })
        .collect()
}

/// A moment as a wall-clock time at a UTC offset (minutes).
pub fn time(ms: i64, offset_min: i32, clock: u8, lang: &str, bn_digits: bool) -> String {
    let local = ms / 60_000 + offset_min as i64;
    let mins = local.rem_euclid(1440);
    let (h, m) = (mins / 60, mins % 60);
    let s = if clock == 24 {
        format!("{h:02}:{m:02}")
    } else {
        let h12 = if h % 12 == 0 { 12 } else { h % 12 };
        let ampm = if lang == "bn" {
            // Bangla clocks name the part of the day instead of AM/PM.
            match h {
                0..=3 => "রাত",
                4..=5 => "ভোর",
                6..=11 => "সকাল",
                12..=14 => "দুপুর",
                15..=17 => "বিকাল",
                18..=19 => "সন্ধ্যা",
                _ => "রাত",
            }
        } else if h < 12 {
            "AM"
        } else {
            "PM"
        };
        if lang == "bn" {
            format!("{ampm} {h12}:{m:02}")
        } else {
            format!("{h12}:{m:02} {ampm}")
        }
    };
    digits(&s, lang == "bn" && bn_digits)
}

/// "1h 05m" / "১ ঘ ৫ মি".
pub fn duration(ms: i64, lang: &str, bn_digits: bool) -> String {
    let total = (ms.max(0) + 59_999) / 60_000;
    let (h, m) = (total / 60, total % 60);
    let s = match (lang, h) {
        ("bn", 0) => format!("{m} মিনিট"),
        ("bn", _) => format!("{h} ঘণ্টা {m} মিনিট"),
        (_, 0) => format!("{m} min"),
        _ => format!("{h}h {m:02}m"),
    };
    digits(&s, lang == "bn" && bn_digits)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats() {
        // 09:49 UTC is 15:49 in Dhaka.
        let ms = 9 * 3_600_000 + 49 * 60_000;
        assert_eq!(time(ms, 360, 12, "en", false), "3:49 PM");
        assert_eq!(time(ms, 360, 24, "en", false), "15:49");
        assert_eq!(time(ms, 360, 12, "bn", true), "বিকাল ৩:৪৯");
        assert_eq!(duration(65 * 60_000, "en", false), "1h 05m");
        assert_eq!(duration(30_000, "en", false), "1 min");
        assert_eq!(prayer("dhuhr", "en", true), "Jumu'ah");
    }
}
