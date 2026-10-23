//! Waqt command-line interface. The desktop app is src/desktop.rs.

use std::path::PathBuf;

use anyhow::Result;
use chrono::{Duration, NaiveDate, Utc};
use clap::{Parser, Subcommand};

use waqt::config::{data_dir, Config};
use waqt::{audio, hijri, schedule, system, text, web};

#[derive(Parser)]
#[command(name = "waqt-cli", version, about)]
struct Cli {
    /// Path to the TOML config file. Defaults to the app's own.
    #[arg(short, long, global = true)]
    config: Option<PathBuf>,
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Run the web UI on 127.0.0.1 (no tray, no start-up entry).
    Serve {
        #[arg(long, default_value_t = 8097)]
        port: u16,
    },
    /// Print prayer times for a number of days from a date.
    Times {
        /// First day (YYYY-MM-DD); today by default.
        #[arg(long)]
        date: Option<NaiveDate>,
        #[arg(long, default_value_t = 1)]
        days: i64,
    },
    /// Upcoming Islamic dates.
    Events,
    /// Checks the audio output (silently) and shows a test notification.
    Selftest,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let dir = data_dir();
    std::fs::create_dir_all(&dir)?;
    let config_path = cli.config.unwrap_or_else(|| dir.join("config.toml"));
    let cfg = Config::load_or_create(&config_path)?;

    match cli.cmd {
        Cmd::Serve { port } => {
            let server = web::Server::bind(cfg, config_path, dir, port, None, false).await?;
            println!("Waqt on http://{}", server.addr()?);
            server.run().await
        }
        Cmd::Times { date, days } => {
            let start = date.unwrap_or_else(|| schedule::local_date(schedule::zone(&cfg), Utc::now()));
            println!("{} ({:.4}, {:.4}) · {:?} · {:?}", cfg.location.name, cfg.location.lat, cfg.location.lng, cfg.calc.method, cfg.calc.asr);
            let cal = schedule::calendar(&cfg);
            for i in 0..days {
                let d = schedule::day(&cfg, start + Duration::days(i));
                let h = cal.from_gregorian(d.date);
                let t = |ms: i64| text::time(ms, d.tz_offset, 24, "en", false);
                println!(
                    "{} {:>2} {:<14} Fajr {}  Sunrise {}  Dhuhr {}  Asr {}  Maghrib {}  Isha {}",
                    d.date,
                    h.day,
                    hijri::MONTHS_EN[(h.month - 1) as usize],
                    t(d.fajr),
                    t(d.sunrise),
                    t(d.dhuhr),
                    t(d.asr),
                    t(d.maghrib),
                    t(d.isha)
                );
            }
            Ok(())
        }
        Cmd::Selftest => {
            let a = audio::Audio::start(&dir);
            // Volume 0: exercises decoding and the sound device without
            // making a sound.
            a.play(audio::Src::Builtin("makkah"), 0, true, "test");
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
            match a.playing() {
                Some(p) => println!("audio: playing {} since {}", p.sound, p.started),
                None => println!("audio: NOT playing"),
            }
            a.stop();
            tokio::time::sleep(std::time::Duration::from_millis(800)).await;
            println!("audio after stop: {:?}", a.playing().map(|p| p.sound));
            let png = dir.join("icon.png");
            if png.exists() {
                system::register_notifications(&png);
            }
            system::toast("Waqt · test", "Notifications are working. Adhan alerts will look like this.", None);
            println!("notification shown");
            Ok(())
        }
        Cmd::Events => {
            let today = schedule::local_date(schedule::zone(&cfg), Utc::now());
            for (d, h, e) in schedule::calendar(&cfg).upcoming(today, 385) {
                println!("{d} ({:>3} days)  {:>2} {:<16} {}", (d - today).num_days(), h.day, hijri::MONTHS_EN[(h.month - 1) as usize], e.en);
            }
            Ok(())
        }
    }
}
