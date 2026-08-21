"""Turn generated atelier plates into compact wallpapers without extra people."""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(r"E:\DeepSeekHarness\projects\dsh-taffy-theme\assets\taffy")
CACHE = Path(r"E:\taffy\.cache\downloads")
SIZE = (1920, 1080)


def load_rgb(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    return image.resize(SIZE, Image.Resampling.LANCZOS)


def strip_person(image: Image.Image) -> Image.Image:
    from rembg import new_session, remove

    session = new_session("u2netp")
    rgba = image.convert("RGBA")
    cut = remove(rgba, session=session)
    if not isinstance(cut, Image.Image):
        cut = Image.open(BytesIO(cut)).convert("RGBA")
    mask = cut.split()[3].point(lambda value: 255 if value > 24 else 0)
    fill = image.filter(ImageFilter.GaussianBlur(36))
    return Image.composite(fill, image, mask)


def save_webp(image: Image.Image, name: str) -> None:
    dest = ROOT / name
    generated = ROOT / "generated" / name
    generated.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=68, method=4)
    image.save(generated, "WEBP", quality=68, method=4)
    print("wallpaper", dest, dest.stat().st_size)


def main() -> None:
    light_src = CACHE / "assets" / "taffy-atelier-light-empty.png"
    if not light_src.exists():
        light_src = Path(r"C:\Users\SYH\.cursor\projects\e-taffy\assets\taffy-atelier-light-empty.png")
    dark_src = CACHE / "taffy-wallpapers" / "taffy-atelier-dark.png"
    if not dark_src.exists():
        dark_src = Path(r"C:\Users\SYH\.cursor\projects\e-taffy\assets\taffy-atelier-dark.png")

    light = strip_person(load_rgb(light_src))
    dark = load_rgb(dark_src)
    save_webp(light, "wallpaper-light.webp")
    save_webp(dark, "wallpaper-dark.webp")


if __name__ == "__main__":
    main()
