"""Measure shipped Taffy figure assets for verify-assets.mjs."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

CREAM = (255, 247, 241, 255)


def luma(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def measure_figure(path: Path, cream_gate: bool = False) -> dict:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    opaque = fringe = 0
    edge_dark = edge_total = 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if a >= 250:
                opaque += 1
            if 0 < a < 200:
                fringe += 1
            on_edge = (
                x == 0
                or y == 0
                or x == width - 1
                or y == height - 1
                or pixels[x - 1, y][3] < 20
                or pixels[x + 1, y][3] < 20
                or pixels[x, y - 1][3] < 20
                or pixels[x, y + 1][3] < 20
            )
            if on_edge and a >= 40:
                edge_total += 1
                if luma(r, g, b) < 80:
                    edge_dark += 1

    dark_edge_ratio = 0.0
    if cream_gate:
        canvas = Image.new("RGBA", image.size, CREAM)
        canvas.alpha_composite(image)
        comp = canvas.convert("RGB").load()
        dark_comp = comp_total = 0
        for y in range(height):
            for x in range(width):
                if pixels[x, y][3] < 20:
                    continue
                on_edge = (
                    x == 0
                    or y == 0
                    or x == width - 1
                    or y == height - 1
                    or pixels[x - 1, y][3] < 20
                    or pixels[x + 1, y][3] < 20
                    or pixels[x, y - 1][3] < 20
                    or pixels[x + 1, y][3] < 20
                )
                if not on_edge:
                    continue
                comp_total += 1
                r, g, b = comp[x, y]
                if luma(r, g, b) < 120:
                    dark_comp += 1
        dark_edge_ratio = dark_comp / max(comp_total, 1)

    bbox = image.getbbox() or (0, 0, width, height)
    area = max(width * height, 1)
    return {
        "width": width,
        "height": height,
        "bytes": path.stat().st_size,
        "opaqueRatio": round(opaque / area, 4),
        "fringeRatio": round(fringe / area, 4),
        "darkEdgeRatio": round(dark_edge_ratio, 4),
        "bboxAreaRatio": round(((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) / area, 4),
    }


def main() -> None:
    path = Path(sys.argv[1])
    cream_gate = sys.argv[2] == "cream" if len(sys.argv) > 2 else False
    print(json.dumps(measure_figure(path, cream_gate=cream_gate)))


if __name__ == "__main__":
    main()
