//! Waqt: prayer times with adhan, the Hijri calendar, Qibla, a prayer
//! tracker and tasbih.
//!
//! Two front ends share this library: the `waqt-cli` CLI (src/main.rs) and
//! the `waqt` desktop app (src/desktop.rs), which adds the tray icon.

pub mod astro;
pub mod audio;
pub mod config;
pub mod hijri;
pub mod online;
pub mod prayer;
pub mod schedule;
pub mod store;
pub mod system;
pub mod text;
pub mod web;
