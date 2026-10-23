//! Plays the adhan and chimes from a dedicated thread, independent of the
//! window, so the adhan sounds even when the app sits in the tray.
//!
//! Recordings differ a lot in loudness; each one is measured once and
//! played back at a matched level.

use std::collections::HashMap;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use rodio::buffer::SamplesBuffer;
use rodio::{Decoder, OutputStream, Sink, Source};
use serde::Serialize;

pub struct SoundDef {
    pub id: &'static str,
    pub name: &'static str,
    pub name_bn: &'static str,
    /// Includes "as-salatu khayrun min an-nawm" for Fajr.
    pub fajr: bool,
    pub bytes: &'static [u8],
}

/// Recordings from the Internet Archive marked public domain / CC0
/// ("Azaan of World Mosques", "Adzan Kota", "Makkah Azan").
pub static SOUNDS: [SoundDef; 9] = [
    SoundDef { id: "makkah", name: "Makkah · Masjid al-Haram", name_bn: "মক্কা · মসজিদুল হারাম", fajr: false, bytes: include_bytes!("../assets/adhan/makkah.mp3") },
    SoundDef { id: "madinah", name: "Madinah · Masjid an-Nabawi", name_bn: "মদিনা · মসজিদে নববী", fajr: false, bytes: include_bytes!("../assets/adhan/madinah.mp3") },
    SoundDef { id: "mishary", name: "Mishary Rashid Alafasy", name_bn: "মিশারি রাশিদ আলাফাসি", fajr: false, bytes: include_bytes!("../assets/adhan/mishary.mp3") },
    SoundDef { id: "aqsa", name: "Al-Aqsa · Naji Qazzaz", name_bn: "আল-আকসা · নাজি কাজ্জাজ", fajr: false, bytes: include_bytes!("../assets/adhan/aqsa.mp3") },
    SoundDef { id: "abdulbasit", name: "Abdul Basit · Cairo", name_bn: "আব্দুল বাসিত · কায়রো", fajr: false, bytes: include_bytes!("../assets/adhan/abdulbasit.mp3") },
    SoundDef { id: "istanbul", name: "Istanbul · Turkey", name_bn: "ইস্তাম্বুল · তুরস্ক", fajr: false, bytes: include_bytes!("../assets/adhan/istanbul.mp3") },
    SoundDef { id: "makkah-fajr", name: "Makkah · Fajr adhan", name_bn: "মক্কা · ফজরের আজান", fajr: true, bytes: include_bytes!("../assets/adhan/makkah-fajr.mp3") },
    SoundDef { id: "madinah-fajr", name: "Madinah · Fajr adhan", name_bn: "মদিনা · ফজরের আজান", fajr: true, bytes: include_bytes!("../assets/adhan/madinah-fajr.mp3") },
    SoundDef { id: "short", name: "Short · first takbir only", name_bn: "সংক্ষিপ্ত · শুধু প্রথম তাকবির", fajr: false, bytes: include_bytes!("../assets/adhan/short.mp3") },
];

pub fn builtin(id: &str) -> Option<&'static SoundDef> {
    SOUNDS.iter().find(|s| s.id == id)
}

#[derive(Debug, Clone)]
pub enum Src {
    Builtin(&'static str),
    Custom(PathBuf),
    Chime,
    /// The chime four times: the Sehri wake-up alarm.
    Alarm,
}

impl Src {
    fn key(&self) -> String {
        match self {
            Src::Builtin(id) => id.to_string(),
            Src::Custom(p) => format!("custom:{}", p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default()),
            Src::Chime => "chime".into(),
            Src::Alarm => "alarm".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Playing {
    /// What it's for: a prayer key, "test", "reminder"…
    pub label: String,
    pub sound: String,
    /// Unix ms.
    pub started: i64,
}

enum Cmd {
    Play { src: Src, volume: f32, fade: bool, label: String },
    Stop,
}

pub struct Audio {
    tx: Mutex<mpsc::Sender<Cmd>>,
    pub state: Arc<Mutex<Option<Playing>>>,
    sounds_dir: PathBuf,
}

/// Target loudness (RMS of samples in -1..1) every recording is matched to.
const TARGET_RMS: f32 = 0.11;

impl Audio {
    pub fn start(data_dir: &Path) -> Audio {
        let (tx, rx) = mpsc::channel::<Cmd>();
        let state: Arc<Mutex<Option<Playing>>> = Arc::new(Mutex::new(None));
        let gains: Arc<Mutex<HashMap<String, f32>>> = Arc::new(Mutex::new(load_gains(data_dir)));
        let sounds_dir = data_dir.join("sounds");

        // Measure the built-in recordings in the background, once.
        {
            let gains = gains.clone();
            let path = data_dir.join("gains.json");
            std::thread::spawn(move || {
                let mut changed = false;
                for s in &SOUNDS {
                    if gains.lock().unwrap().contains_key(s.id) {
                        continue;
                    }
                    if let Ok(g) = measure_gain(Cursor::new(s.bytes)) {
                        gains.lock().unwrap().insert(s.id.to_string(), g);
                        changed = true;
                    }
                }
                if changed {
                    if let Ok(text) = serde_json::to_string(&*gains.lock().unwrap()) {
                        let _ = std::fs::write(path, text);
                    }
                }
            });
        }

        let st = state.clone();
        std::thread::Builder::new()
            .name("audio".into())
            .spawn(move || {
                let mut current: Option<(OutputStream, Sink)> = None;
                loop {
                    match rx.recv_timeout(Duration::from_millis(200)) {
                        Ok(Cmd::Play { src, volume, fade, label }) => {
                            if let Some((_, sink)) = current.take() {
                                sink.stop();
                            }
                            let gain = gains.lock().unwrap().get(&src.key()).copied();
                            match play(&src, volume, fade, gain) {
                                Ok((stream, sink, measured)) => {
                                    if let Some(g) = measured {
                                        gains.lock().unwrap().insert(src.key(), g);
                                    }
                                    current = Some((stream, sink));
                                    *st.lock().unwrap() = Some(Playing { label, sound: src.key(), started: now_ms() });
                                }
                                Err(e) => {
                                    eprintln!("audio: {e:#}");
                                    *st.lock().unwrap() = None;
                                }
                            }
                        }
                        Ok(Cmd::Stop) => {
                            if let Some((_stream, sink)) = current.take() {
                                // A short fade sounds far better than a cut.
                                let v = sink.volume();
                                for i in (0..12).rev() {
                                    sink.set_volume(v * i as f32 / 12.0);
                                    std::thread::sleep(Duration::from_millis(40));
                                }
                                sink.stop();
                            }
                            *st.lock().unwrap() = None;
                        }
                        Err(RecvTimeoutError::Timeout) => {
                            if current.as_ref().is_some_and(|(_, s)| s.empty()) {
                                current = None;
                                *st.lock().unwrap() = None;
                            }
                        }
                        Err(RecvTimeoutError::Disconnected) => break,
                    }
                }
            })
            .expect("starting the audio thread");

        Audio { tx: Mutex::new(tx), state, sounds_dir }
    }

    /// Resolves a configured sound id: a built-in recording, or
    /// `custom:<file>` in the app's sounds folder.
    pub fn resolve(&self, id: &str) -> Option<Src> {
        match id {
            "chime" => return Some(Src::Chime),
            "alarm" => return Some(Src::Alarm),
            _ => {}
        }
        if let Some(name) = id.strip_prefix("custom:") {
            // Only plain file names inside the sounds folder.
            if name.contains(['/', '\\']) || name.contains("..") {
                return None;
            }
            let p = self.sounds_dir.join(name);
            return p.exists().then_some(Src::Custom(p));
        }
        builtin(id).map(|s| Src::Builtin(s.id))
    }

    /// `volume` is 0 to 100.
    pub fn play(&self, src: Src, volume: u32, fade: bool, label: &str) {
        let v = (volume.min(100) as f32 / 100.0).powf(1.6);
        let _ = self.tx.lock().unwrap().send(Cmd::Play { src, volume: v, fade, label: label.to_string() });
    }

    pub fn stop(&self) {
        let _ = self.tx.lock().unwrap().send(Cmd::Stop);
    }

    pub fn playing(&self) -> Option<Playing> {
        self.state.lock().unwrap().clone()
    }

    pub fn sounds_dir(&self) -> &Path {
        &self.sounds_dir
    }
}

fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn load_gains(dir: &Path) -> HashMap<String, f32> {
    std::fs::read_to_string(dir.join("gains.json")).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

/// The factor that brings a recording to the target loudness.
fn measure_gain<R: std::io::Read + std::io::Seek + Send + Sync + 'static>(reader: R) -> Result<f32> {
    let dec = Decoder::new(reader).context("decoding")?;
    let (mut sum, mut n) = (0f64, 0u64);
    for s in dec.convert_samples::<f32>() {
        sum += (s as f64) * (s as f64);
        n += 1;
    }
    if n == 0 {
        return Err(anyhow!("empty recording"));
    }
    let rms = (sum / n as f64).sqrt() as f32;
    Ok((TARGET_RMS / rms.max(1e-4)).clamp(0.3, 3.0))
}

/// Returns the stream (which must stay alive while playing), the sink and,
/// for a recording not measured before, its gain.
fn play(src: &Src, volume: f32, fade: bool, gain: Option<f32>) -> Result<(OutputStream, Sink, Option<f32>)> {
    let (stream, handle) = OutputStream::try_default().context("opening the audio output")?;
    let sink = Sink::try_new(&handle).context("opening the audio output")?;
    let mut measured = None;
    let fade_in = if fade { Duration::from_secs(4) } else { Duration::from_millis(30) };
    match src {
        Src::Builtin(id) => {
            let def = builtin(id).ok_or_else(|| anyhow!("unknown sound {id}"))?;
            let g = match gain {
                Some(g) => g,
                None => {
                    let g = measure_gain(Cursor::new(def.bytes)).unwrap_or(1.0);
                    measured = Some(g);
                    g
                }
            };
            let dec = Decoder::new(Cursor::new(def.bytes)).context("decoding the adhan")?;
            sink.append(dec.convert_samples::<f32>().amplify(g).fade_in(fade_in));
        }
        Src::Custom(path) => {
            let g = match gain {
                Some(g) => g,
                None => {
                    let f = std::fs::File::open(path).with_context(|| format!("opening {}", path.display()))?;
                    let g = measure_gain(std::io::BufReader::new(f)).unwrap_or(1.0);
                    measured = Some(g);
                    g
                }
            };
            let f = std::fs::File::open(path).with_context(|| format!("opening {}", path.display()))?;
            let dec = Decoder::new(std::io::BufReader::new(f)).context("decoding the sound file")?;
            sink.append(dec.convert_samples::<f32>().amplify(g).fade_in(fade_in));
        }
        Src::Chime => sink.append(SamplesBuffer::new(1, 44_100, chime())),
        Src::Alarm => sink.append(SamplesBuffer::new(1, 44_100, chime().repeat(4))),
    }
    sink.set_volume(volume);
    Ok((stream, sink, measured))
}

/// A soft two-note bell, synthesised: a few inharmonic partials with
/// exponential decay, like a small singing bowl.
pub fn chime() -> Vec<f32> {
    let sr = 44_100.0f32;
    let len = (sr * 3.2) as usize;
    let mut out = vec![0f32; len];
    let notes = [(659.25f32, 0.0f32, 1.0f32), (987.77, 0.42, 0.75)];
    let partials = [(1.0f32, 1.0f32, 2.2f32), (2.01, 0.35, 3.4), (2.76, 0.18, 4.6), (4.07, 0.08, 6.0)];
    for (f0, start, amp) in notes {
        let s0 = (start * sr) as usize;
        for (i, slot) in out.iter_mut().enumerate().skip(s0) {
            let t = (i - s0) as f32 / sr;
            let attack = (t / 0.006).min(1.0);
            let mut v = 0.0;
            for (ratio, a, decay) in partials {
                v += a * (-t * decay).exp() * (2.0 * std::f32::consts::PI * f0 * ratio * t).sin();
            }
            *slot += amp * attack * v;
        }
    }
    let peak = out.iter().fold(0f32, |m, v| m.max(v.abs())).max(1e-6);
    out.iter_mut().for_each(|v| *v *= 0.55 / peak);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chime_is_normalised() {
        let c = chime();
        let peak = c.iter().fold(0f32, |m, v| m.max(v.abs()));
        assert!((peak - 0.55).abs() < 1e-3);
    }

    #[test]
    fn builtin_sounds_decode() {
        for s in &SOUNDS {
            let g = measure_gain(Cursor::new(s.bytes)).unwrap_or_else(|e| panic!("{}: {e}", s.id));
            assert!(g > 0.0, "{}", s.id);
        }
    }
}
