//! Waqt desktop app: the web UI in a native window, a tray icon that keeps
//! the adhan running when the window is closed, and a floating countdown to
//! the next prayer that stays on the desktop on its own.

// No console window behind the app in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use tao::dpi::{LogicalSize, PhysicalPosition};
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder, EventLoopWindowTarget};
use tao::window::{Icon, Theme, Window, WindowBuilder};
use tray_icon::menu::{CheckMenuItem, Menu, MenuEvent, MenuId, MenuItem, PredefinedMenuItem};
use tray_icon::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use wry::{WebContext, WebViewBuilder};

use waqt::config::{data_dir, Config};
use waqt::system;
use waqt::web::{App, DesktopEvent, Hook, Server};

const ICON_64: &[u8] = include_bytes!("../assets/icon-64.rgba");
const ICON_32: &[u8] = include_bytes!("../assets/icon-32.rgba");
const ICON_PNG: &[u8] = include_bytes!("../assets/icon-256.png");

/// The countdown's size in logical pixels (the pill plus a small margin for
/// its glow).
const OVERLAY_W: f64 = 372.0;
const OVERLAY_H: f64 = 66.0;

enum UserEvent {
    Show,
    Adhan,
    Config,
    Tray(TrayIconEvent),
    Menu(MenuId),
    Ipc(String),
    OverlayIpc(String),
    Tick,
}

fn main() {
    if let Err(e) = run() {
        rfd::MessageDialog::new()
            .set_level(rfd::MessageLevel::Error)
            .set_title("Waqt")
            .set_description(format!("{e:#}"))
            .set_buttons(rfd::MessageButtons::Ok)
            .show();
        std::process::exit(1);
    }
}

/// Where the countdown was last left, so it comes back to the same spot
/// (on whichever monitor) after a restart.
fn load_position(path: &PathBuf) -> Option<PhysicalPosition<i32>> {
    let text = std::fs::read_to_string(path).ok()?;
    let (x, y) = text.trim().split_once(',')?;
    Some(PhysicalPosition::new(x.trim().parse().ok()?, y.trim().parse().ok()?))
}

/// A saved position on whichever connected monitor holds it, nudged so the
/// whole countdown is on screen; otherwise the bottom-right corner of the
/// main monitor, above the taskbar.
fn overlay_position<T>(target: &EventLoopWindowTarget<T>, saved: Option<PhysicalPosition<i32>>) -> Option<PhysicalPosition<i32>> {
    let size = |scale: f64| ((OVERLAY_W * scale) as i32, (OVERLAY_H * scale) as i32);
    if let Some(p) = saved {
        let home = target.available_monitors().find(|m| {
            let (mp, ms) = (m.position(), m.size());
            p.x >= mp.x - 60 && p.y >= mp.y - 30 && p.x < mp.x + ms.width as i32 && p.y < mp.y + ms.height as i32
        });
        if let Some(m) = home {
            let (mp, ms) = (m.position(), m.size());
            let (w, h) = size(m.scale_factor());
            let x = p.x.clamp(mp.x, (mp.x + ms.width as i32 - w).max(mp.x));
            let y = p.y.clamp(mp.y, (mp.y + ms.height as i32 - h).max(mp.y));
            return Some(PhysicalPosition::new(x, y));
        }
    }
    let m = target.primary_monitor().or_else(|| target.available_monitors().next())?;
    let scale = m.scale_factor();
    let (mp, ms) = (m.position(), m.size());
    let (w, h) = size(scale);
    Some(PhysicalPosition::new(mp.x + ms.width as i32 - w - (16.0 * scale) as i32, mp.y + ms.height as i32 - h - (60.0 * scale) as i32))
}

fn run() -> Result<()> {
    let hidden = std::env::args().any(|a| a == "--hidden");
    let dir = data_dir();
    std::fs::create_dir_all(&dir).with_context(|| format!("creating {}", dir.display()))?;

    // One copy at a time: two would both sound every adhan. A second launch
    // brings the running copy forward instead.
    let lock = std::fs::OpenOptions::new().create(true).truncate(false).write(true).open(dir.join("app.lock"))?;
    if lock.try_lock().is_err() {
        if let Ok(port) = std::fs::read_to_string(dir.join("port")) {
            let _ = std::net::TcpStream::connect_timeout(&format!("127.0.0.1:{}", port.trim()).parse()?, Duration::from_secs(2)).and_then(|mut s| {
                use std::io::Write;
                write!(s, "GET /api/show HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n")
            });
        }
        return Ok(());
    }

    let icon_png = dir.join("icon.png");
    let _ = std::fs::write(&icon_png, ICON_PNG);
    system::register_notifications(&icon_png);

    let config_path = dir.join("config.toml");
    let config = Config::load_or_create(&config_path)?;
    // Keep the start-up entry pointing at this copy of the program.
    let _ = system::set_autostart(config.startup.autostart);

    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = Arc::new(Mutex::new(event_loop.create_proxy()));
    let send = {
        let proxy = proxy.clone();
        move |e: UserEvent| {
            let _ = proxy.lock().unwrap().send_event(e);
        }
    };

    let hook: Hook = {
        let send = send.clone();
        Arc::new(move |e| match e {
            DesktopEvent::Show => send(UserEvent::Show),
            DesktopEvent::Adhan => send(UserEvent::Adhan),
            DesktopEvent::Config => send(UserEvent::Config),
        })
    };

    // The server and scheduler get their own thread and runtime; the
    // window's event loop must own the main thread.
    let (tx, rx) = mpsc::channel::<Result<(std::net::SocketAddr, Arc<App>)>>();
    let server_dir = dir.clone();
    std::thread::spawn(move || {
        let rt = match tokio::runtime::Builder::new_multi_thread().enable_all().build() {
            Ok(rt) => rt,
            Err(e) => {
                let _ = tx.send(Err(anyhow!(e)));
                return;
            }
        };
        rt.block_on(async move {
            match Server::bind(config, config_path, server_dir, 0, Some(hook), true).await {
                Ok(server) => {
                    let app = server.state.clone();
                    let _ = tx.send(server.addr().map(|a| (a, app)));
                    if let Err(e) = server.run().await {
                        eprintln!("server stopped: {e:#}");
                    }
                }
                Err(e) => {
                    let _ = tx.send(Err(e));
                }
            }
        });
    });
    let (addr, app) = rx.recv().context("the app's server failed to start")??;
    let _ = std::fs::write(dir.join("port"), addr.port().to_string());
    let origin = format!("http://{addr}");

    let window = WindowBuilder::new()
        .with_title("Waqt — Prayer Times")
        .with_inner_size(LogicalSize::new(1240.0, 820.0))
        .with_min_inner_size(LogicalSize::new(360.0, 150.0))
        .with_window_icon(Icon::from_rgba(ICON_64.to_vec(), 64, 64).ok())
        .with_theme(Some(Theme::Dark))
        .with_visible(!hidden)
        .build(&event_loop)?;

    let mut context = WebContext::new(Some(dir.join("webview")));
    let allowed = origin.clone();
    let ipc_send = send.clone();
    let webview = WebViewBuilder::new_with_web_context(&mut context)
        .with_url(format!("{origin}/"))
        .with_background_color((7, 14, 30, 255))
        .with_devtools(cfg!(debug_assertions))
        .with_autoplay(true)
        .with_navigation_handler(move |url| url.starts_with(&allowed) || url == "about:blank")
        .with_ipc_handler(move |req| ipc_send(UserEvent::Ipc(req.body().clone())))
        .build(&window)
        .context("opening the app window (is Microsoft Edge WebView2 installed?)")?;

    // The desktop countdown: its own small window, always on top, no taskbar
    // button, transparent around the pill. It lives on when the main window
    // is closed, and can be dragged to any monitor.
    let pos_file = dir.join("countdown-position.txt");
    let mut ob = WindowBuilder::new()
        .with_title("Waqt countdown")
        .with_window_icon(Icon::from_rgba(ICON_64.to_vec(), 64, 64).ok())
        .with_decorations(false)
        .with_transparent(true)
        .with_always_on_top(true)
        .with_resizable(false)
        .with_focused(false)
        .with_visible(false)
        .with_inner_size(LogicalSize::new(OVERLAY_W, OVERLAY_H));
    #[cfg(windows)]
    {
        use tao::platform::windows::WindowBuilderExtWindows;
        ob = ob.with_skip_taskbar(true).with_undecorated_shadow(false);
    }
    if let Some(p) = overlay_position(&event_loop, load_position(&pos_file)) {
        ob = ob.with_position(p);
    }
    let overlay = ob.build(&event_loop)?;
    let allowed = origin.clone();
    let overlay_send = send.clone();
    let overlay_view = WebViewBuilder::new_with_web_context(&mut context)
        .with_url(format!("{origin}/overlay"))
        .with_transparent(true)
        .with_background_color((0, 0, 0, 0))
        .with_devtools(cfg!(debug_assertions))
        .with_navigation_handler(move |url| url.starts_with(&allowed))
        .with_ipc_handler(move |req| overlay_send(UserEvent::OverlayIpc(req.body().clone())))
        .build(&overlay)
        .context("opening the countdown window")?;

    let apply_overlay = |overlay: &Window, cfg: &Config| {
        overlay.set_visible(cfg.overlay.enabled);
        let _ = overlay.set_ignore_cursor_events(cfg.overlay.enabled && cfg.overlay.locked);
    };
    apply_overlay(&overlay, &app.config());

    // Tray icon and its menu.
    let cfg = app.config();
    let open_item = MenuItem::new("Open Waqt", true, None);
    let next_item = MenuItem::new(app.tray_text(), false, None);
    let stop_item = MenuItem::new("Stop adhan", false, None);
    let mute_item = CheckMenuItem::new("Silence adhan for today", true, app.is_muted_today(), None);
    let count_item = CheckMenuItem::new("Countdown on desktop", true, cfg.overlay.enabled, None);
    let lock_item = CheckMenuItem::new("Lock countdown (clicks pass through)", cfg.overlay.enabled, cfg.overlay.locked, None);
    let quit_item = MenuItem::new("Quit Waqt", true, None);
    let menu = Menu::new();
    menu.append_items(&[
        &open_item,
        &next_item,
        &PredefinedMenuItem::separator(),
        &stop_item,
        &mute_item,
        &PredefinedMenuItem::separator(),
        &count_item,
        &lock_item,
        &PredefinedMenuItem::separator(),
        &quit_item,
    ])?;
    let tray = TrayIconBuilder::new()
        .with_tooltip(app.tray_text())
        .with_icon(tray_icon::Icon::from_rgba(ICON_32.to_vec(), 32, 32)?)
        .with_menu(Box::new(menu))
        .with_menu_on_left_click(false)
        .build()?;
    {
        let send = send.clone();
        TrayIconEvent::set_event_handler(Some(move |e| send(UserEvent::Tray(e))));
    }
    {
        let send = send.clone();
        MenuEvent::set_event_handler(Some(move |e: MenuEvent| send(UserEvent::Menu(e.id))));
    }
    {
        let send = send.clone();
        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_secs(10));
            send(UserEvent::Tick);
        });
    }

    let mut told_about_tray = false;
    // A moved countdown's position, written out on the next tick rather
    // than on every pixel of a drag.
    let mut moved: Option<PhysicalPosition<i32>> = None;
    let save_position = move |p: PhysicalPosition<i32>| {
        let _ = std::fs::write(&pos_file, format!("{},{}", p.x, p.y));
    };

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        let show = |w: &Window| {
            w.set_visible(true);
            w.set_minimized(false);
            w.set_focus();
        };
        let sync_menu = || {
            let cfg = app.config();
            count_item.set_checked(cfg.overlay.enabled);
            lock_item.set_checked(cfg.overlay.locked);
            lock_item.set_enabled(cfg.overlay.enabled);
        };

        match event {
            Event::UserEvent(UserEvent::Show) => show(&window),
            Event::UserEvent(UserEvent::Adhan) => {
                show(&window);
                let _ = webview.evaluate_script("window.onAdhan && onAdhan()");
            }
            Event::UserEvent(UserEvent::Config) => {
                apply_overlay(&overlay, &app.config());
                sync_menu();
                let _ = overlay_view.evaluate_script("window.reloadOverlay && reloadOverlay()");
            }
            Event::UserEvent(UserEvent::Tray(e)) => match e {
                TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } => {
                    if window.is_visible() && !window.is_minimized() {
                        window.set_visible(false);
                    } else {
                        show(&window);
                    }
                }
                TrayIconEvent::DoubleClick { .. } => show(&window),
                _ => {}
            },
            Event::UserEvent(UserEvent::Menu(id)) => {
                if id == *open_item.id() {
                    show(&window);
                } else if id == *stop_item.id() {
                    app.audio.stop();
                } else if id == *mute_item.id() {
                    app.set_muted_today(mute_item.is_checked());
                    let _ = webview.evaluate_script("window.refreshLive && refreshLive()");
                } else if id == *count_item.id() {
                    app.set_overlay(Some(count_item.is_checked()), None);
                } else if id == *lock_item.id() {
                    app.set_overlay(None, Some(lock_item.is_checked()));
                } else if id == *quit_item.id() {
                    app.audio.stop();
                    if let Some(p) = moved.take() {
                        save_position(p);
                    }
                    *control_flow = ControlFlow::Exit;
                }
            }
            Event::UserEvent(UserEvent::Ipc(msg)) => match msg.as_str() {
                // The window's "mini" button: hand over to the desktop
                // countdown and get out of the way.
                "mini:1" => {
                    if !app.config().overlay.enabled {
                        app.set_overlay(Some(true), None);
                    }
                    overlay.set_visible(true);
                    window.set_visible(false);
                }
                "mini:0" => show(&window),
                // The title bar follows the page's light or dark theme.
                "theme:light" => window.set_theme(Some(Theme::Light)),
                "theme:dark" => window.set_theme(Some(Theme::Dark)),
                "drag" => {
                    let _ = window.drag_window();
                }
                "hide" => window.set_visible(false),
                "quit" => {
                    app.audio.stop();
                    *control_flow = ControlFlow::Exit;
                }
                _ => {}
            },
            Event::UserEvent(UserEvent::OverlayIpc(msg)) => match msg.as_str() {
                "drag" => {
                    let _ = overlay.drag_window();
                }
                "open" => show(&window),
                "overlay:hide" => {
                    app.set_overlay(Some(false), None);
                    let bn = app.config().language == "bn";
                    let (t, b) = if bn {
                        ("কাউন্টডাউন লুকানো হয়েছে", "আবার দেখাতে ট্রে আইকনে ডান-ক্লিক করে \"Countdown on desktop\" চালু করুন।")
                    } else {
                        ("Countdown hidden", "Right-click the Waqt tray icon and tick \"Countdown on desktop\" to bring it back.")
                    };
                    std::thread::spawn(move || system::toast(t, b, None));
                }
                _ => {}
            },
            Event::UserEvent(UserEvent::Tick) => {
                let text = app.tray_text();
                let _ = tray.set_tooltip(Some(&text));
                next_item.set_text(&text);
                stop_item.set_enabled(app.audio.playing().is_some());
                mute_item.set_checked(app.is_muted_today());
                if let Some(p) = moved.take() {
                    save_position(p);
                }
            }
            Event::WindowEvent { window_id, event: WindowEvent::Moved(p), .. } if window_id == overlay.id() => {
                moved = Some(p);
            }
            Event::WindowEvent { window_id, event: WindowEvent::CloseRequested, .. } if window_id == overlay.id() => {
                // Alt+F4 on the countdown just hides it.
                app.set_overlay(Some(false), None);
            }
            Event::WindowEvent { event: WindowEvent::CloseRequested, .. } => {
                if app.config().startup.close_to_tray {
                    window.set_visible(false);
                    if !told_about_tray {
                        told_about_tray = true;
                        let bn = app.config().language == "bn";
                        let (t, b) = if bn {
                            ("ওয়াক্ত চালু আছে", "আজান ও ডেস্কটপের কাউন্টডাউন চালু থাকবে। বন্ধ করতে ট্রে আইকনে ডান-ক্লিক করুন।")
                        } else {
                            ("Waqt is still running", "The adhan and the desktop countdown keep working. Right-click the tray icon to quit.")
                        };
                        std::thread::spawn(move || system::toast(t, b, None));
                    }
                } else {
                    app.audio.stop();
                    *control_flow = ControlFlow::Exit;
                }
            }
            _ => {}
        }
    });
}
