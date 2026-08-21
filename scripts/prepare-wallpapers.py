"""Optional maintainer script: regenerate wallpaper webp from source plates."""
from __future__ import annotations

import os
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "taffy"
CACHE = Path(os.environ.get("TAFFY_CACHE", ROOT / ".cache" / "wallpaper-src"))
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
    dest = ASSETS / name
    generated = ASSETS / "generated" / name
    generated.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=68, method=4)
    image.save(generated, "WEBP", quality=68, method=4)
    print("wallpaper", dest, dest.stat().st_size)


def main() -> None:
    light_src = Path(sys.argv[1]) if len(sys.argv) > 1 else CACHE / "light.png"
    dark_src = Path(sys.argv[2]) if len(sys.argv) > 2 else CACHE / "dark.png"
    if not light_src.is_file():
        raise SystemExit(f"Missing light source: {light_src}\nPlace plates under {CACHE} or pass paths as argv.")
    if not dark_src.is_file():
        raise SystemExit(f"Missing dark source: {dark_src}\nPlace plates under {CACHE} or pass paths as argv.")

    light = strip_person(load_rgb(light_src))
    dark = load_rgb(dark_src)
    save_webp(light, "wallpaper-light.webp")
    save_webp(dark, "wallpaper-dark.webp")


if __name__ == "__main__":
    main()
