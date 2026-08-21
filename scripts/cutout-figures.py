"""Cut the four Taffy JPGs to transparent WebP figures."""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(r"E:\DeepSeekHarness\projects\dsh-taffy-theme\assets\taffy")
JOBS = (
    "left-light",
    "right-light",
    "left-dark",
    "right-dark",
)


def rembg_cutout(src: Path) -> Image.Image:
    from rembg import new_session, remove

    session = new_session("u2netp")
    image = Image.open(src).convert("RGBA")
    out = remove(image, session=session)
    if not isinstance(out, Image.Image):
        out = Image.open(BytesIO(out)).convert("RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out


def save_pair(image: Image.Image, stem: str) -> None:
    png = ROOT / f"{stem}.png"
    webp = ROOT / f"{stem}.webp"
    generated = ROOT / "generated"
    generated.mkdir(parents=True, exist_ok=True)
    image.save(png, "PNG")
    image.save(webp, "WEBP", quality=80, method=4)
    image.save(generated / f"{stem}.png", "PNG")
    image.save(generated / f"{stem}.webp", "WEBP", quality=80, method=4)
    print("cutout", stem, image.size, png.stat().st_size, webp.stat().st_size)


def main() -> None:
    for stem in JOBS:
        src = ROOT / "source" / f"{stem}.jpg"
        print("processing", src)
        save_pair(rembg_cutout(src), stem)


if __name__ == "__main__":
    main()
