//! The few things fetched online: city search (Open-Meteo geocoding),
//! finding the computer's location from its IP address (ipwho.is), and
//! the verse of the day (alquran.cloud). Prayer times never need the
//! network.

use std::path::Path;
use std::time::Duration;

use anyhow::{bail, Context, Result};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::prayer::{Asr, Method};

pub fn client() -> Result<reqwest::Client> {
    Ok(reqwest::Client::builder()
        .user_agent(concat!("Waqt/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(8))
        .timeout(Duration::from_secs(20))
        .build()?)
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Place {
    pub name: String,
    /// District, state or region.
    pub region: String,
    pub country: String,
    pub country_code: String,
    pub lat: f64,
    pub lng: f64,
    pub elevation: f64,
    pub timezone: String,
}

pub async fn search_places(client: &reqwest::Client, q: &str, lang: &str) -> Result<Vec<Place>> {
    let q = q.trim();
    if q.chars().count() < 2 {
        return Ok(Vec::new());
    }
    let v: Value = client
        .get("https://geocoding-api.open-meteo.com/v1/search")
        .query(&[("name", q), ("count", "12"), ("language", if lang == "bn" { "bn" } else { "en" }), ("format", "json")])
        .send()
        .await
        .context("reaching the city search")?
        .json()
        .await?;
    let s = |r: &Value, k: &str| r[k].as_str().unwrap_or("").to_string();
    Ok(v["results"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|r| {
            Some(Place {
                name: s(r, "name"),
                region: [s(r, "admin2"), s(r, "admin1")].into_iter().find(|x| !x.is_empty()).unwrap_or_default(),
                country: s(r, "country"),
                country_code: s(r, "country_code"),
                lat: r["latitude"].as_f64()?,
                lng: r["longitude"].as_f64()?,
                elevation: r["elevation"].as_f64().unwrap_or(0.0),
                timezone: s(r, "timezone"),
            })
        })
        .collect())
}

/// Roughly where this computer is, from its public IP address.
pub async fn detect(client: &reqwest::Client) -> Result<Place> {
    let v: Value = client.get("https://ipwho.is/").send().await.context("reaching the location service")?.json().await?;
    if v["success"].as_bool() != Some(true) {
        bail!("the location service could not place this connection");
    }
    let s = |k: &str| v[k].as_str().unwrap_or("").to_string();
    Ok(Place {
        name: s("city"),
        region: s("region"),
        country: s("country"),
        country_code: s("country_code"),
        lat: v["latitude"].as_f64().unwrap_or(0.0),
        lng: v["longitude"].as_f64().unwrap_or(0.0),
        elevation: 0.0,
        timezone: v["timezone"]["id"].as_str().unwrap_or("").to_string(),
    })
}

/// How a country's Hijri months usually begin.
pub fn recommend_rule(country_code: &str) -> crate::hijri::Rule {
    use crate::hijri::Rule;
    match country_code.to_ascii_uppercase().as_str() {
        "BD" | "PK" | "IN" | "AF" | "LK" | "NP" | "MA" | "GB" => Rule::Sighting,
        _ => Rule::UmmAlQura,
    }
}

/// The calculation method and Asr school most used in a country.
pub fn recommend(country_code: &str) -> (Method, Asr) {
    match country_code.to_ascii_uppercase().as_str() {
        "BD" | "PK" | "IN" | "AF" => (Method::Karachi, Asr::Hanafi),
        "US" | "CA" => (Method::Isna, Asr::Standard),
        "SA" | "YE" => (Method::Makkah, Asr::Standard),
        "EG" | "SY" | "LB" | "SD" | "LY" | "DZ" | "IQ" | "JO" | "PS" => (Method::Egypt, Asr::Standard),
        "AE" => (Method::Dubai, Asr::Standard),
        "KW" => (Method::Kuwait, Asr::Standard),
        "QA" => (Method::Qatar, Asr::Standard),
        "BH" | "OM" => (Method::Gulf, Asr::Standard),
        "MY" | "SG" | "ID" | "BN" => (Method::Singapore, Asr::Standard),
        "TR" => (Method::Turkey, Asr::Hanafi),
        "IR" => (Method::Tehran, Asr::Standard),
        "FR" => (Method::France, Asr::Standard),
        "RU" => (Method::Russia, Asr::Standard),
        _ => (Method::Mwl, Asr::Standard),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ayah {
    pub date: NaiveDate,
    pub number: u32,
    pub surah: u32,
    pub ayah: u32,
    pub surah_en: String,
    pub surah_ar: String,
    pub arabic: String,
    pub english: String,
    pub bangla: String,
}

/// The verse for a date: the same verse all day, a different one each day,
/// cached so it shows offline once fetched.
pub async fn ayah_of_day(client: &reqwest::Client, cache: &Path, date: NaiveDate) -> Result<Ayah> {
    let file = cache.join(format!("ayah-{date}.json"));
    if let Some(a) = std::fs::read_to_string(&file).ok().and_then(|t| serde_json::from_str(&t).ok()) {
        return Ok(a);
    }
    // Spread over the whole Quran: 6236 verses, stepping by a prime.
    let days = (date - NaiveDate::from_ymd_opt(2024, 1, 1).unwrap_or_default()).num_days().unsigned_abs();
    let number = (days * 2_917 % 6_236 + 1) as u32;
    let v: Value = client
        .get(format!("https://api.alquran.cloud/v1/ayah/{number}/editions/quran-uthmani,en.sahih,bn.bengali"))
        .send()
        .await
        .context("reaching alquran.cloud")?
        .json()
        .await?;
    let d = v["data"].as_array().context("unexpected answer from alquran.cloud")?;
    let text = |i: usize| d.get(i).and_then(|e| e["text"].as_str()).unwrap_or("").to_string();
    let first = d.first().context("no verse returned")?;
    let a = Ayah {
        date,
        number,
        surah: first["surah"]["number"].as_u64().unwrap_or(0) as u32,
        ayah: first["numberInSurah"].as_u64().unwrap_or(0) as u32,
        surah_en: first["surah"]["englishName"].as_str().unwrap_or("").to_string(),
        surah_ar: first["surah"]["name"].as_str().unwrap_or("").to_string(),
        arabic: text(0),
        english: text(1),
        bangla: text(2),
    };
    std::fs::create_dir_all(cache).ok();
    if let Ok(t) = serde_json::to_string(&a) {
        let _ = std::fs::write(&file, t);
    }
    // Keep only a week of cached verses.
    if let Ok(entries) = std::fs::read_dir(cache) {
        for e in entries.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if let Some(d) = name.strip_prefix("ayah-").and_then(|s| s.strip_suffix(".json")) {
                if d.parse::<NaiveDate>().is_ok_and(|d| (date - d).num_days() > 7) {
                    let _ = std::fs::remove_file(e.path());
                }
            }
        }
    }
    Ok(a)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recommendations() {
        assert_eq!(recommend("bd"), (Method::Karachi, Asr::Hanafi));
        assert_eq!(recommend("US"), (Method::Isna, Asr::Standard));
        assert_eq!(recommend("XX"), (Method::Mwl, Asr::Standard));
    }
}
