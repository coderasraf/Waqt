//! Windows integration: toast notifications under the app's own name and
//! icon, and starting with Windows. No-ops elsewhere.

use std::path::Path;

/// The id notifications are shown under. Registered in the user's registry
/// so Windows shows "Waqt" and our icon instead of a generic source.
pub const APP_ID: &str = "Waqt.PrayerTimes";

/// Registers the notification identity. Cheap; done at every start so a
/// moved install still has the right icon.
pub fn register_notifications(icon_png: &Path) {
    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok((key, _)) = hkcu.create_subkey(format!(r"Software\Classes\AppUserModelId\{APP_ID}")) {
            let _ = key.set_value("DisplayName", &"Waqt");
            let _ = key.set_value("IconUri", &icon_png.display().to_string());
            let _ = key.set_value("IconBackgroundColor", &"FF0B1D3A");
        }
    }
    #[cfg(not(windows))]
    let _ = icon_png;
}

/// Shows a notification. `on_click` runs when the user clicks it.
pub fn toast(title: &str, body: &str, on_click: Option<Box<dyn Fn() + Send + 'static>>) {
    #[cfg(windows)]
    {
        use tauri_winrt_notification::{Duration, Toast};
        let mut t = Toast::new(APP_ID).title(title).text1(body).sound(None).duration(Duration::Short);
        if let Some(f) = on_click {
            t = t.on_activated(move |_| {
                f();
                Ok(())
            });
        }
        if let Err(e) = t.show() {
            eprintln!("notification failed: {e:?}");
        }
    }
    #[cfg(not(windows))]
    {
        let _ = on_click;
        eprintln!("{title}: {body}");
    }
}

const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

/// Adds or removes the app from the programs Windows starts at sign-in.
/// It starts hidden in the tray.
pub fn set_autostart(on: bool) -> anyhow::Result<()> {
    #[cfg(windows)]
    {
        use winreg::enums::{HKEY_CURRENT_USER, KEY_SET_VALUE};
        use winreg::RegKey;
        let key = RegKey::predef(HKEY_CURRENT_USER).open_subkey_with_flags(RUN_KEY, KEY_SET_VALUE)?;
        if on {
            let exe = std::env::current_exe()?;
            key.set_value("Waqt", &format!("\"{}\" --hidden", exe.display()))?;
        } else {
            let _ = key.delete_value("Waqt");
        }
    }
    #[cfg(not(windows))]
    let _ = on;
    Ok(())
}
