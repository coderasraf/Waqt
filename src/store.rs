//! What the user records: prayers prayed (the tracker), made-up (qada)
//! prayers, tasbih counts, and whether adhan is muted today. One JSON file,
//! rewritten atomically on every change.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

/// Tracker values per prayer.
pub const NONE: u8 = 0;
pub const ON_TIME: u8 = 1;
pub const JAMAAH: u8 = 2;
pub const LATE: u8 = 3;
pub const MISSED: u8 = 4;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct State {
    /// "2026-10-23" -> status of Fajr, Dhuhr, Asr, Maghrib, Isha.
    pub tracker: BTreeMap<String, [u8; 5]>,
    /// Missed prayers made up since tracking began.
    pub qada_done: u32,
    pub tasbih: Tasbih,
    /// Adhan is silenced for this date ("2026-10-23").
    pub muted: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Tasbih {
    /// Lifetime count per dhikr id.
    pub totals: BTreeMap<String, u64>,
    /// All dhikr per date.
    pub daily: BTreeMap<String, u64>,
}

pub struct Store {
    path: PathBuf,
    pub state: State,
}

impl Store {
    /// A missing file starts fresh; an unreadable one is kept aside rather
    /// than overwritten, since it holds the user's history.
    pub fn open(path: &Path) -> Store {
        let state = match std::fs::read_to_string(path) {
            Ok(text) => serde_json::from_str(&text).unwrap_or_else(|_| {
                let _ = std::fs::copy(path, path.with_extension("json.broken"));
                State::default()
            }),
            Err(_) => State::default(),
        };
        Store { path: path.to_path_buf(), state }
    }

    pub fn save(&self) {
        let tmp = self.path.with_extension("json.tmp");
        if let Ok(text) = serde_json::to_string(&self.state) {
            if std::fs::write(&tmp, text).is_ok() {
                let _ = std::fs::rename(&tmp, &self.path);
            }
        }
    }

    pub fn set_prayer(&mut self, date: &str, index: usize, status: u8) {
        if index >= 5 || status > MISSED {
            return;
        }
        let entry = self.state.tracker.entry(date.to_string()).or_insert([NONE; 5]);
        entry[index] = status;
        if entry.iter().all(|s| *s == NONE) {
            self.state.tracker.remove(date);
        }
    }

    pub fn day(&self, date: &str) -> [u8; 5] {
        self.state.tracker.get(date).copied().unwrap_or([NONE; 5])
    }

    pub fn add_tasbih(&mut self, id: &str, date: &str, n: u64) {
        *self.state.tasbih.totals.entry(id.to_string()).or_default() += n;
        *self.state.tasbih.daily.entry(date.to_string()).or_default() += n;
    }
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct Stats {
    /// Days in a row (ending today or yesterday) with all five prayed.
    pub streak: u32,
    pub best_streak: u32,
    /// Share of prayers marked prayed in the last 7 / 30 days, 0..1.
    pub week: f64,
    pub month: f64,
    /// Per prayer, share prayed in the last 30 days.
    pub per_prayer: [f64; 5],
    pub jamaah_month: u32,
    pub missed_total: u32,
    pub qada_left: u32,
}

fn prayed(s: u8) -> bool {
    matches!(s, ON_TIME | JAMAAH | LATE)
}

/// Statistics up to `today` (inclusive). Days without any entry count as
/// not tracked rather than missed, except inside the streak.
pub fn stats(st: &State, today: chrono::NaiveDate) -> Stats {
    use chrono::Duration;
    let key = |d: chrono::NaiveDate| d.format("%Y-%m-%d").to_string();
    let get = |d: chrono::NaiveDate| st.tracker.get(&key(d)).copied();
    let full = |d: chrono::NaiveDate| get(d).is_some_and(|s| s.iter().all(|x| prayed(*x)));

    // A streak may end yesterday while today is still in progress.
    let mut streak = 0;
    let mut d = if full(today) { today } else { today - Duration::days(1) };
    while full(d) {
        streak += 1;
        d -= Duration::days(1);
    }

    let mut best = 0;
    let mut run = 0;
    let mut prev: Option<chrono::NaiveDate> = None;
    for (k, s) in &st.tracker {
        let Ok(d) = k.parse::<chrono::NaiveDate>() else { continue };
        if s.iter().all(|x| prayed(*x)) {
            run = if prev.is_some_and(|p| d - p == Duration::days(1)) { run + 1 } else { 1 };
            prev = Some(d);
            best = best.max(run);
        } else {
            run = 0;
            prev = None;
        }
    }

    let share = |days: i64| -> f64 {
        let (mut done, mut total) = (0u32, 0u32);
        for i in 0..days {
            if let Some(s) = get(today - Duration::days(i)) {
                total += 5;
                done += s.iter().filter(|x| prayed(**x)).count() as u32;
            }
        }
        if total == 0 {
            0.0
        } else {
            done as f64 / total as f64
        }
    };

    let mut per = [0f64; 5];
    let mut tracked_days = 0;
    let mut jamaah = 0;
    for i in 0..30 {
        if let Some(s) = get(today - Duration::days(i)) {
            tracked_days += 1;
            for (p, v) in s.iter().enumerate() {
                if prayed(*v) {
                    per[p] += 1.0;
                }
                if *v == JAMAAH {
                    jamaah += 1;
                }
            }
        }
    }
    if tracked_days > 0 {
        per.iter_mut().for_each(|v| *v /= tracked_days as f64);
    }
    let missed: u32 = st.tracker.values().map(|s| s.iter().filter(|x| **x == MISSED).count() as u32).sum();

    Stats {
        streak,
        best_streak: best.max(streak),
        week: share(7),
        month: share(30),
        per_prayer: per,
        jamaah_month: jamaah,
        missed_total: missed,
        qada_left: missed.saturating_sub(st.qada_done),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    #[test]
    fn streaks() {
        let mut s = Store { path: PathBuf::from("unused.json"), state: State::default() };
        let today = NaiveDate::from_ymd_opt(2026, 10, 23).unwrap();
        for d in 19..=22 {
            for p in 0..5 {
                s.set_prayer(&format!("2026-10-{d}"), p, ON_TIME);
            }
        }
        s.set_prayer("2026-10-23", 0, ON_TIME);
        s.set_prayer("2026-10-18", 1, MISSED);
        let st = stats(&s.state, today);
        assert_eq!(st.streak, 4);
        assert_eq!(st.best_streak, 4);
        assert_eq!(st.missed_total, 1);
        assert_eq!(st.qada_left, 1);
        s.set_prayer("2026-10-23", 0, NONE);
        assert!(!s.state.tracker.contains_key("2026-10-23"));
    }
}
