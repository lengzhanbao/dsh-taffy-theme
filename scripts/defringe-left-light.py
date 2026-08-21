"""Remove rembg black-matte fringe from the light-theme left Taffy figure."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(r"E:\DeepSeekHarness\projects\dsh-taffy-theme\assets\taffy")
SRC = ROOT / "generated" / "left-light.png"
OUT_STEMS = (
    ROOT / "left-light",
)
PREVIEW = Path(r"E:\taffy\.cache\temp\left-light-defringe-preview.png")


def luma(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def neighbor_color(
    px,
    x: int,
    y: int,
    w: int,
    h: int,
    min_luma: float = 48,
    radius: int = 3,
) -> tuple[int, int, int] | None:
    best = None
    best_score = -1.0
    for ny in range(max(0, y - radius), min(h, y + radius + 1)):
        for nx in range(max(0, x - radius), min(w, x + radius + 1)):
            if nx == x and ny == y:
                continue
            nr, ng, nb, na = px[nx, ny]
            if na < 200:
                continue
            nl = luma(nr, ng, nb)
            if nl < min_luma:
                continue
            score = na + nl
            if score > best_score:
                best_score = score
                best = (nr, ng, nb)
    return best


def defringe(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    w, h = image.size
    channels = image.split()
    rgb = Image.merge("RGB", channels[:3])
    alpha = channels[3]

    # Keep only solid interior color, then push it 2px outward so fringe
    # pixels inherit clothing/hair color instead of rembg soot.
    interior_mask = alpha.point(lambda v: 255 if v >= 220 else 0)
    interior_mask = interior_mask.filter(ImageFilter.MinFilter(5))
    spread_rgb = Image.composite(rgb, Image.new("RGB", (w, h), (255, 214, 230)), interior_mask)
    spread_rgb = spread_rgb.filter(ImageFilter.MaxFilter(5))
    spread_rgb = spread_rgb.filter(ImageFilter.GaussianBlur(0.6))

    # Choke the matte so the original 1–2px black halo is gone.
    choked = alpha.filter(ImageFilter.MinFilter(7))
    new_alpha = Image.blend(alpha, choked, 0.82).point(lambda v: 0 if v < 56 else (255 if v > 200 else v))

    rebuilt = Image.merge("RGBA", (*spread_rgb.split(), new_alpha))
    px = rebuilt.load()
    src = image.load()

    # Restore interior pixels so MaxFilter does not smear bows into the face.
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            na = px[x, y][3]
            if a >= 230 and luma(r, g, b) >= 40:
                px[x, y] = (r, g, b, 255 if na >= 180 else na)
            elif na > 0:
                nr, ng, nb, _ = px[x, y]
                fill = neighbor_color(src, x, y, w, h)
                if fill is not None:
                    nr, ng, nb = fill
                # Brighten leftover soot on white stockings / sleeves.
                if luma(nr, ng, nb) < 90 and luma(r, g, b) < 90:
                    brighter = neighbor_color(px, x, y, w, h)
                    if brighter is not None and luma(*brighter) >= 110:
                        nr, ng, nb = brighter
                    else:
                        px[x, y] = (0, 0, 0, 0)
                        continue
                px[x, y] = (nr, ng, nb, 255 if na >= 96 else na)

    # Pass 4: the original drawing has a charcoal silhouette stroke. On a
    # cream UI that reads as a black halo, so recolor the outer 1px to the
    # nearby cloth/hair color.
    px = rebuilt.load()
    w2, h2 = rebuilt.size
    stroke_fixes: list[tuple[int, int, tuple[int, int, int, int]]] = []
    for y in range(h2):
        for x in range(w2):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            on_edge = (
                x == 0 or y == 0 or x == w2 - 1 or y == h2 - 1
                or px[x - 1, y][3] < 40
                or px[x + 1, y][3] < 40
                or px[x, y - 1][3] < 40
                or px[x, y + 1][3] < 40
            )
            if not on_edge:
                continue
            fill = neighbor_color(px, x, y, w2, h2, min_luma=155, radius=7)
            if fill is None:
                if luma(r, g, b) < 80:
                    stroke_fixes.append((x, y, (0, 0, 0, 0)))
                continue
            if luma(r, g, b) < 150:
                fr, fg, fb = fill
                stroke_fixes.append((x, y, (fr, fg, fb, 255)))
    for x, y, color in stroke_fixes:
        px[x, y] = color

    bbox = rebuilt.getbbox()
    if bbox:
        pad = 8
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        rebuilt = rebuilt.crop((left, top, right, bottom))
    return rebuilt


def preview_on_cream(figure: Image.Image) -> Image.Image:
    cream = Image.new("RGBA", figure.size, (255, 247, 241, 255))
    cream.alpha_composite(figure)
    return cream.convert("RGB")


def main() -> None:
    src = Image.open(SRC)
    out = defringe(src)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview_on_cream(out).save(PREVIEW, "PNG")
    for stem in OUT_STEMS:
        stem.parent.mkdir(parents=True, exist_ok=True)
        out.save(stem.with_suffix(".png"), "PNG")
        out.save(stem.with_suffix(".webp"), "WEBP", quality=88, method=4)
        print("wrote", stem.with_suffix(".png"), out.size, stem.with_suffix(".png").stat().st_size)
    print("preview", PREVIEW)


if __name__ == "__main__":
    main()
