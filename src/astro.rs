//! The Qibla direction and the moon's phase.

use serde::Serialize;

use crate::prayer::{fix_angle, sun_alt_az};

pub const KAABA: (f64, f64) = (21.422487, 39.826206);

/// Great-circle bearing to the Kaaba, degrees clockwise from true north.
pub fn qibla_bearing(lat: f64, lng: f64) -> f64 {
    let (p1, p2) = (lat.to_radians(), KAABA.0.to_radians());
    let dl = (KAABA.1 - lng).to_radians();
    let y = dl.sin() * p2.cos();
    let x = p1.cos() * p2.sin() - p1.sin() * p2.cos() * dl.cos();
    fix_angle(y.atan2(x).to_degrees())
}

/// Distance to the Kaaba in kilometres.
pub fn qibla_distance(lat: f64, lng: f64) -> f64 {
    let (p1, p2) = (lat.to_radians(), KAABA.0.to_radians());
    let dp = p2 - p1;
    let dl = (KAABA.1 - lng).to_radians();
    let a = (dp / 2.0).sin().powi(2) + p1.cos() * p2.cos() * (dl / 2.0).sin().powi(2);
    6371.0 * 2.0 * a.sqrt().atan2((1.0 - a).sqrt())
}

#[derive(Debug, Clone, Serialize)]
pub struct SunAlign {
    /// Unix milliseconds.
    pub at: i64,
    /// True when the sun is in the Qibla direction (face the sun); false
    /// when it's directly behind (turn your back to it).
    pub facing: bool,
    pub altitude: f64,
}

/// Moments today, between `start_ms` and `end_ms`, when the sun's azimuth
/// lines up with the Qibla or its opposite while the sun is up: a way to
/// find the Qibla without a compass.
pub fn sun_alignments(lat: f64, lng: f64, start_ms: i64, end_ms: i64) -> Vec<SunAlign> {
    let q = qibla_bearing(lat, lng);
    let opposite = fix_angle(q + 180.0);
    let jd = |ms: i64| ms as f64 / 86_400_000.0 + 2_440_587.5;
    let signed = |a: f64| ((a + 540.0) % 360.0) - 180.0;
    let mut out = Vec::new();
    let step = 60_000;
    let mut prev: Option<(f64, f64, f64)> = None;
    let mut t = start_ms;
    while t <= end_ms {
        let (alt, az) = sun_alt_az(jd(t), lat, lng);
        let (d1, d2) = (signed(az - q), signed(az - opposite));
        if let Some((palt, p1, p2)) = prev {
            if alt > 2.0 && palt > 2.0 {
                if p1.signum() != d1.signum() && p1.abs() < 20.0 {
                    out.push(SunAlign { at: t, facing: true, altitude: alt });
                }
                if p2.signum() != d2.signum() && p2.abs() < 20.0 {
                    out.push(SunAlign { at: t, facing: false, altitude: alt });
                }
            }
        }
        prev = Some((alt, d1, d2));
        t += step;
    }
    out
}

#[derive(Debug, Clone, Serialize)]
pub struct MoonPhase {
    /// Days since the new moon, 0 to 29.5.
    pub age: f64,
    /// Lit fraction, 0 to 1.
    pub illumination: f64,
    /// 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
    pub phase: f64,
    pub name: &'static str,
}

const SYNODIC: f64 = 29.530588853;

/// The moon's phase at a moment (Unix milliseconds). Accurate to a few
/// hours, which is plenty for drawing it.
pub fn moon_phase(ms: i64) -> MoonPhase {
    let jd = ms as f64 / 86_400_000.0 + 2_440_587.5;
    // A new moon: 6 Jan 2000 18:14 UT.
    let age = (jd - 2_451_550.26).rem_euclid(SYNODIC);
    let phase = age / SYNODIC;
    let illumination = (1.0 - (2.0 * std::f64::consts::PI * phase).cos()) / 2.0;
    let name = match phase {
        p if !(0.0339..0.9661).contains(&p) => "new_moon",
        p if p < 0.2161 => "waxing_crescent",
        p if p < 0.2839 => "first_quarter",
        p if p < 0.4661 => "waxing_gibbous",
        p if p < 0.5339 => "full_moon",
        p if p < 0.7161 => "waning_gibbous",
        p if p < 0.7839 => "last_quarter",
        _ => "waning_crescent",
    };
    MoonPhase { age, illumination, phase, name }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dhaka_qibla() {
        // Dhaka's Qibla is about 277.5° (west, slightly north).
        let b = qibla_bearing(23.8103, 90.4125);
        assert!((b - 277.5).abs() < 1.0, "{b}");
        let d = qibla_distance(23.8103, 90.4125);
        assert!((d - 5160.0).abs() < 80.0, "{d}");
    }

    #[test]
    fn new_york_qibla() {
        let b = qibla_bearing(40.7128, -74.006);
        assert!((b - 58.5).abs() < 1.0, "{b}");
    }

    #[test]
    fn known_full_moon() {
        // Full moon on 26 Oct 2026 ~04:12 UT.
        let ms = chrono::NaiveDate::from_ymd_opt(2026, 10, 26).unwrap().and_hms_opt(4, 0, 0).unwrap().and_utc().timestamp_millis();
        let m = moon_phase(ms);
        assert!(m.illumination > 0.97, "{m:?}");
    }
}
