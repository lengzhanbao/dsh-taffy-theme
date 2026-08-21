"""Generate transparent Taffy PNGs.

Avatar is a sticker with enclosed white clothing: flood-fill paper from the
borders only. Portrait has paint blobs and a name banner: use rembg u2netp
when available, otherwise the same flood-fill.
"""
from __future__ import annotations

from collections import deque
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(r"E:\DeepSeekHarness\projects\dsh-taffy-theme\assets\taffy")


def is_backdrop(r: int, g: int, b: int, threshold: int) -> bool:
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    chroma = max(r, g, b) - min(r, g, b)
    if luma >= threshold and chroma < 28:
        return True
    if luma >= threshold - 10 and chroma < 18:
        return True
    return False


def flood_cutout(src: Path, dst: Path, threshold: int) -> dict[str, int | str]:
    image = Image.open(src).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def idx(x: int, y: int) -> int:
        return y * width + x

    for x in range(width):
        for y in (0, height - 1):
            r, g, b, _a = pixels[x, y]
            if is_backdrop(r, g, b, threshold):
                queue.append((x, y))
                visited[idx(x, y)] = 1
    for y in range(height):
        for x in (0, width - 1):
            r, g, b, _a = pixels[x, y]
            if is_backdrop(r, g, b, threshold) and visited[idx(x, y)] == 0:
                queue.append((x, y))
                visited[idx(x, y)] = 1

    cleared = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pixels[x, y]
        if not is_backdrop(r, g, b, threshold):
            continue
        pixels[x, y] = (r, g, b, 0)
        cleared += 1
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and visited[idx(nx, ny)] == 0:
                nr, ng, nb, _ = pixels[nx, ny]
                if is_backdrop(nr, ng, nb, threshold):
                    visited[idx(nx, ny)] = 1
                    queue.append((nx, ny))

    dst.parent.mkdir(parents=True, exist_ok=True)
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    image.save(dst, "PNG")
    return {"width": image.size[0], "height": image.size[1], "cleared": cleared, "dst": str(dst), "method": "flood"}


def rembg_cutout(src: Path, dst: Path) -> dict[str, int | str]:
    from rembg import new_session, remove

    session = new_session("u2netp")
    image = Image.open(src).convert("RGBA")
    out = remove(image, session=session)
    if not isinstance(out, Image.Image):
        out = Image.open(BytesIO(out)).convert("RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "PNG")
    return {"width": out.size[0], "height": out.size[1], "cleared": -1, "dst": str(dst), "method": "rembg-u2netp"}


def main() -> None:
    avatar_src = ROOT / "source" / "taffy-02.webp"
    portrait_src = ROOT / "source" / "taffy-01.webp"

    for dst in (ROOT / "avatar.png", ROOT / "generated" / "avatar.png"):
        print("cutout", flood_cutout(avatar_src, dst, 248))

    try:
        for dst in (ROOT / "portrait.png", ROOT / "generated" / "portrait.png"):
            print("cutout", rembg_cutout(portrait_src, dst))
    except Exception as error:
        print("rembg fallback", error)
        for dst in (ROOT / "portrait.png", ROOT / "generated" / "portrait.png"):
            print("cutout", flood_cutout(portrait_src, dst, 236))


if __name__ == "__main__":
    main()
