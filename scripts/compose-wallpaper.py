"""Compose light/dark paper from Taffy palette. Figures stay as live CSS layers."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(r"E:\DeepSeekHarness\projects\dsh-taffy-theme\assets\taffy")
WIDTH, HEIGHT = 1280, 720


def blob(draw: ImageDraw.ImageDraw, xy: tuple[int, int], radius: int, color: tuple[int, int, int, int]) -> None:
    x, y = xy
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)


def paste_figure(canvas: Image.Image, src: Path, *, box: tuple[int, int], height: int, opacity: float) -> None:
    if not src.exists():
        return
    figure = Image.open(src).convert("RGBA")
    ratio = height / figure.size[1]
    size = (max(1, int(figure.size[0] * ratio)), height)
    figure = figure.resize(size, Image.Resampling.LANCZOS)
    alpha = figure.split()[3].point(lambda value: int(value * opacity))
    figure.putalpha(alpha)
    x, y = box
    x = min(x, WIDTH - size[0])
    y = min(y, HEIGHT - size[1])
    canvas.alpha_composite(figure, (max(0, x), max(0, y)))


def compose_light() -> Image.Image:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (251, 246, 242, 255))
    wash = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(wash)
    blob(draw, (1080, 680), 380, (232, 137, 176, 64))
    blob(draw, (220, 90), 260, (232, 184, 74, 36))
    blob(draw, (640, 40), 200, (248, 200, 220, 32))
    canvas.alpha_composite(wash.filter(ImageFilter.GaussianBlur(42)))
    paste_figure(canvas, ROOT / "portrait.png", box=(760, 80), height=680, opacity=0.16)
    return canvas.convert("RGB")


def compose_dark() -> Image.Image:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (42, 36, 34, 255))
    wash = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(wash)
    blob(draw, (1040, 680), 400, (232, 137, 176, 42))
    blob(draw, (200, 100), 240, (232, 184, 74, 24))
    blob(draw, (640, 360), 300, (58, 50, 46, 70))
    canvas.alpha_composite(wash.filter(ImageFilter.GaussianBlur(46)))
    paste_figure(canvas, ROOT / "portrait.png", box=(760, 80), height=680, opacity=0.14)
    return canvas.convert("RGB")


def save(image: Image.Image, name: str) -> None:
    dest = ROOT / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=52, method=4)
    print("wrote", dest, dest.stat().st_size)


def main() -> None:
    save(compose_light(), "wallpaper-light.webp")
    save(compose_dark(), "wallpaper-dark.webp")
    save(compose_light(), "generated/wallpaper-light.webp")
    save(compose_dark(), "generated/wallpaper-dark.webp")


if __name__ == "__main__":
    main()
