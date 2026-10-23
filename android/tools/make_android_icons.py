"""Builds the Android launcher icons from the desktop icon design.

Writes adaptive-icon foreground and monochrome layers for every density,
plus the 512px Play Store icon. Run from the android/ folder:
    python tools/make_android_icons.py
"""
import os, sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "assets"))
from make_icon import render  # noqa: E402  (the desktop icon)

GOLD = (0xF3, 0xC6, 0x6B, 255)
RES = os.path.join("app", "src", "main", "res")
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def mosque(size, color):
    """The mosque and crescent alone, inside the adaptive icon's safe zone."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Draw in a 66/108 safe zone centred in the canvas.
    z = s * 66 / 108
    ox = oy = (s - z) / 2
    P = lambda x, y: (ox + x * z, oy + y * z)
    base = 0.86
    d.rectangle([*P(0.30, 0.58), *P(0.70, base)], fill=color)
    d.chord([*P(0.27, 0.36), *P(0.73, 0.80)], 180, 360, fill=color)
    d.polygon([P(0.46, 0.40), P(0.5, 0.28), P(0.54, 0.40)], fill=color)
    for cx in (0.13, 0.87):
        d.rectangle([*P(cx - 0.04, 0.38), *P(cx + 0.04, base)], fill=color)
        d.rectangle([*P(cx - 0.06, 0.47), *P(cx + 0.06, 0.505)], fill=color)
        d.polygon([P(cx - 0.04, 0.38), P(cx, 0.26), P(cx + 0.04, 0.38)], fill=color)
    d.rounded_rectangle([*P(0.04, base - 0.005), *P(0.96, base + 0.045)], radius=int(z * 0.01), fill=color)
    door = (0, 0, 0, 0)
    d.chord([*P(0.445, 0.66), *P(0.555, 0.78)], 180, 360, fill=door)
    d.rectangle([*P(0.445, 0.72), *P(0.555, base)], fill=door)
    # Crescent.
    cx, cy, r = P(0.5, 0.12)[0], P(0.5, 0.12)[1], z * 0.085
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    off = r * 0.55
    d.ellipse([cx - r + off, cy - r - off * 0.35, cx + r + off, cy + r - off * 0.35], fill=(0, 0, 0, 0))
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    for name, k in DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{name}")
        os.makedirs(folder, exist_ok=True)
        px = round(108 * k)
        mosque(px, GOLD).save(os.path.join(folder, "ic_launcher_foreground.png"))
        mosque(px, (255, 255, 255, 255)).save(os.path.join(folder, "ic_launcher_monochrome.png"))
    os.makedirs(os.path.join("store"), exist_ok=True)
    render(512).convert("RGB").save(os.path.join("store", "icon-512.png"))
    print("done")


def store_icon(size=512):
    """Full-bleed square for Google Play (Play rounds the corners itself)."""
    top, bottom = (0x0B, 0x1D, 0x3A), (0x0E, 0x4D, 0x5C)
    bg = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(bg)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    big = round(size * 1.3)
    fg = mosque(big, GOLD)
    off = (size - big) // 2
    bg.paste(fg, (off, off), fg)
    return bg


if __name__ == "__main__":
    store_icon().save(os.path.join("store", "icon-512.png"))
