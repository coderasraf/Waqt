//! Waqt desktop app: the web UI in a native window, a tray icon that keeps
//! the adhan running when the window is closed, and a small always-on-top
//! widget mode.

// No console window behind the app in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use tao::dpi::{LogicalSize, PhysicalPosition, PhysicalSize};
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder};
use tao::window::{Icon, Theme, WindowBuilder};
use tray_icon::menu::{CheckMenuItem, Menu, MenuEvent, MenuId, MenuItem, PredefinedMenuItem};
use tray_icon::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use wry::{WebContext, WebViewBuilder};

use waqt::config::{data_dir, Config};
use waqt::system;
use waqt::web::{App, DesktopEvent, Hook, Server};

const ICON_64: &[u8] = include_bytes!("../assets/icon-64.rgba");
const ICON_32: &[u8] = include_bytes!("../assets/icon-32.rgba");
const ICON_PNG: &[u8] = include_bytes!("../assets/icon-256.png");

enum UserEvent {
    Show,
    Adhan,
    Tray(TrayIconEvent),
    Menu(MenuId),
    Ipc(String),
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

    // Tray icon and its menu.
    let open_item = MenuItem::new("Open Waqt", true, None);
    let next_item = MenuItem::new(app.tray_text(), false, None);
    let stop_item = MenuItem::new("Stop adhan", false, None);
    let mute_item = CheckMenuItem::new("Silence adhan for today", true, app.is_muted_today(), None);
    let mini_item = MenuItem::new("Mini widget", true, None);
    let quit_item = MenuItem::new("Quit Waqt", true, None);
    let menu = Menu::new();
    menu.append_items(&[
        &open_item,
        &next_item,
        &PredefinedMenuItem::separator(),
        &stop_item,
        &mute_item,
        &mini_item,
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

    let mut mini: Option<(PhysicalSize<u32>, PhysicalPosition<i32>)> = None;
    let mut told_about_tray = false;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        let show = |w: &tao::window::Window| {
            w.set_visible(true);
            w.set_minimized(false);
            w.set_focus();
        };
        let set_mini = |on: bool, mini: &mut Option<(PhysicalSize<u32>, PhysicalPosition<i32>)>| {
            if on && mini.is_none() {
                let size = window.inner_size();
                let pos = window.outer_position().unwrap_or_default();
                *mini = Some((size, pos));
                window.set_decorations(false);
                window.set_always_on_top(true);
                let scale = window.scale_factor();
                let w = (380.0 * scale) as u32;
                let h = (150.0 * scale) as u32;
                window.set_inner_size(PhysicalSize::new(w, h));
                if let Some(m) = window.current_monitor() {
                    let (ms, mp) = (m.size(), m.position());
                    let margin = (24.0 * scale) as i32;
                    let x = mp.x + ms.width as i32 - w as i32 - margin;
                    let y = mp.y + ms.height as i32 - h as i32 - (64.0 * scale) as i32;
                    window.set_outer_position(PhysicalPosition::new(x, y));
                }
                let _ = webview.evaluate_script("window.onMini && onMini(true)");
            } else if !on {
                if let Some((size, pos)) = mini.take() {
                    window.set_always_on_top(false);
                    window.set_decorations(true);
                    window.set_inner_size(size);
                    window.set_outer_position(pos);
                }
                let _ = webview.evaluate_script("window.onMini && onMini(false)");
            }
            show(&window);
        };

        match event {
            Event::UserEvent(UserEvent::Show) => show(&window),
            Event::UserEvent(UserEvent::Adhan) => {
                if mini.is_none() {
                    show(&window);
                } else {
                    window.set_visible(true);
                }
                let _ = webview.evaluate_script("window.onAdhan && onAdhan()");
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
                    if mini.is_some() {
                        set_mini(false, &mut mini);
                    }
                    show(&window);
                } else if id == *stop_item.id() {
                    app.audio.stop();
                } else if id == *mute_item.id() {
                    app.set_muted_today(mute_item.is_checked());
                    let _ = webview.evaluate_script("window.refreshLive && refreshLive()");
                } else if id == *mini_item.id() {
                    let on = mini.is_none();
                    set_mini(on, &mut mini);
                } else if id == *quit_item.id() {
                    app.audio.stop();
                    *control_flow = ControlFlow::Exit;
                }
            }
            Event::UserEvent(UserEvent::Ipc(msg)) => match msg.as_str() {
                "mini:1" => set_mini(true, &mut mini),
                "mini:0" => set_mini(false, &mut mini),
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
            Event::UserEvent(UserEvent::Tick) => {
                let text = app.tray_text();
                let _ = tray.set_tooltip(Some(&text));
                next_item.set_text(&text);
                stop_item.set_enabled(app.audio.playing().is_some());
                mute_item.set_checked(app.is_muted_today());
            }
            Event::WindowEvent { event: WindowEvent::CloseRequested, .. } => {
                if app.config().startup.close_to_tray {
                    window.set_visible(false);
                    if !told_about_tray {
                        told_about_tray = true;
                        let bn = app.config().language == "bn";
                        let (t, b) = if bn {
                            ("ওয়াক্ত চালু আছে", "আজান চালু রাখতে ওয়াক্ত ট্রেতে চলছে। বন্ধ করতে ট্রে আইকনে ডান-ক্লিক করুন।")
                        } else {
                            ("Waqt is still running", "Waqt stays in the tray so the adhan keeps working. Right-click the tray icon to quit.")
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
