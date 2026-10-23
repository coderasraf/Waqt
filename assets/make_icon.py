"""Draws the Waqt icon: a golden mosque with a crescent under a night sky.

Writes icon.ico (embedded into the .exe by build.rs), icon-64.rgba and
icon-32.rgba (raw RGBA for the window and tray) and icon-256.png (the in-app
logo and notification icon). Run from this directory:
    python make_icon.py
"""
import math
from PIL import Image, ImageDraw, ImageFilter

SS = 4
TOP = (0x0B, 0x1D, 0x3A)
BOTTOM = (0x0E, 0x4D, 0x5C)
GOLD = (0xF3, 0xC6, 0x6B, 255)
GOLD_HI = (0xFF, 0xE3, 0xA3, 255)


def render(size):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    grad = Image.new("RGBA", (s, s))
    gd = ImageDraw.Draw(grad)
    for y in range(s):
        t = y / (s - 1)
        gd.line([(0, y), (s, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)) + (255,))
    # Soft glow behind the dome.
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([s * 0.2, s * 0.25, s * 0.8, s * 0.85], fill=(243, 198, 107, 70))
    grad.alpha_composite(glow.filter(ImageFilter.GaussianBlur(s * 0.08)))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.23), fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    base = s * 0.80
    # Stars.
    for x, y, r in ((0.2, 0.2, 0.012), (0.3, 0.12, 0.008), (0.82, 0.3, 0.01), (0.12, 0.42, 0.007)):
        d.ellipse([s * (x - r), s * (y - r), s * (x + r), s * (y + r)], fill=(255, 255, 255, 220))
    # Main dome: a half ellipse with a pointed top on a drum.
    d.rectangle([s * 0.33, s * 0.55, s * 0.67, base], fill=GOLD)
    d.chord([s * 0.31, s * 0.36, s * 0.69, s * 0.74], 180, 360, fill=GOLD)
    d.polygon([(s * 0.46, s * 0.40), (s * 0.5, s * 0.30), (s * 0.54, s * 0.40)], fill=GOLD)
    # Minarets.
    for cx in (0.22, 0.78):
        d.rectangle([s * (cx - 0.035), s * 0.40, s * (cx + 0.035), base], fill=GOLD)
        d.rectangle([s * (cx - 0.05), s * 0.47, s * (cx + 0.05), s * 0.5], fill=GOLD)
        d.polygon([(s * (cx - 0.035), s * 0.40), (s * cx, s * 0.30), (s * (cx + 0.035), s * 0.40)], fill=GOLD)
    # Ground.
    d.rounded_rectangle([s * 0.12, base - s * 0.005, s * 0.88, base + s * 0.04], radius=int(s * 0.01), fill=GOLD)
    # Door.
    d.chord([s * 0.45, s * 0.64, s * 0.55, s * 0.74], 180, 360, fill=TOP + (255,))
    d.rectangle([s * 0.45, s * 0.69, s * 0.55, base], fill=TOP + (255,))
    # Crescent above the dome.
    cx, cy, r = s * 0.5, s * 0.2, s * 0.075
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD_HI)
    off = r * 0.55
    d.ellipse([cx - r + off, cy - r - off * 0.35, cx + r + off, cy + r - off * 0.35], fill=(0, 0, 0, 0))
    out = img.resize((size, size), Image.LANCZOS)
    # The crescent cut-out above punched through the background too; repaint
    # it from the gradient where it is fully transparent inside the square.
    bg = Image.new("RGBA", (size, size))
    bgd = ImageDraw.Draw(bg)
    for y in range(size):
        t = y / max(1, size - 1)
        bgd.line([(0, y), (size, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)) + (255,))
    m = mask.resize((size, size), Image.LANCZOS)
    under = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    under.paste(bg, (0, 0), m)
    under.alpha_composite(out)
    return under


if __name__ == "__main__":
    big = render(256)
    big.save("icon-256.png")
    big.save("icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    with open("icon-64.rgba", "wb") as f:
        f.write(render(64).tobytes())
    with open("icon-32.rgba", "wb") as f:
        f.write(render(32).tobytes())
