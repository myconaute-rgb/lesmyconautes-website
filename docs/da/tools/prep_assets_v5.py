#!/usr/bin/env python3
"""Prépare les assets du site à partir des fichiers d'Aline (vague v5 du 29/07/2026).

À lancer depuis la racine du repo : `python3 docs/da/tools/prep_assets_v5.py`.
Idempotent — relit toujours les originaux de `docs/da/v5-2026-07-29/`, jamais ses propres sorties.

- logosbio.png  -> src/assets/logos/certifie-ab.png + certifie-eu.png (découpe + trim alpha)
- pictos        -> src/assets/icons/... 512x512 PNG, blanc pur, centrés
- photos        -> src/assets/photos/*.jpg (aplat de fond conservé : crème #fffaf1 / anis #87b800,
                   qui sont les tokens exacts du site, mais rogné sur le sujet — sinon les visuels
                   s'affichent minuscules dans leur cadre en object-contain)

Modèle pour les prochaines vagues : adapter SRC, PICTOS et PHOTOS_MAP.
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path("docs/da/v5-2026-07-29")
LOGOS = Path("src/assets/logos")
PHOTOS = Path("src/assets/photos")


def trim_alpha(im, thr=10):
    bbox = im.getchannel("A").point(lambda p: 255 if p > thr else 0).getbbox()
    return im.crop(bbox)


def split_logos():
    im = Image.open(SRC / "logosbio.png").convert("RGBA")
    a = im.getchannel("A").point(lambda p: 255 if p > 10 else 0)
    w, h = im.size
    # colonnes vides = séparateur entre les deux logos
    cols = [x for x in range(w) if a.crop((x, 0, x + 1, h)).getbbox() is None]
    # plus grande plage de colonnes vides située dans le tiers central
    runs, cur = [], []
    for x in cols:
        if cur and x == cur[-1] + 1:
            cur.append(x)
        else:
            if cur:
                runs.append(cur)
            cur = [x]
    if cur:
        runs.append(cur)
    inner = [r for r in runs if 0.15 * w < r[0] < 0.85 * w]
    gap = max(inner, key=len)
    cut = (gap[0] + gap[-1]) // 2
    print(f"  coupe à x={cut} (gap {gap[0]}..{gap[-1]})")
    for name, box in (("certifie-ab.png", (0, 0, cut, h)), ("certifie-eu.png", (cut, 0, w, h))):
        part = trim_alpha(im.crop(box))
        # hauteur normalisée 560 px (affiché ~112 px, x2 en retina, marge de manœuvre)
        ratio = 560 / part.size[1]
        part = part.resize((round(part.size[0] * ratio), 560), Image.LANCZOS)
        part.save(LOGOS / name, optimize=True)
        print(f"  {name} {part.size}")


PICTOS = {
    "Les Myconautes picto champignon.png": "src/assets/icons/culture/substrat.png",
    "Les Myconautes picto humidite.png": "src/assets/icons/culture/humidite.png",
    "Les Myconautes picto air.png": "src/assets/icons/culture/air-frais.png",
    "Les Myconautes picto tempo.png": "src/assets/icons/culture/patience.png",
    "Les Myconautes picto temperature.png": "src/assets/icons/aline/temperature.png",
    "Les Myconautes picto congelation.png": "src/assets/icons/aline/congelation.png",
}


def prep_pictos():
    for src, dst in PICTOS.items():
        im = Image.open(SRC / src).convert("RGBA")
        a = im.getchannel("A")
        # blanc pur partout : supprime le liseré gris laissé par le détourage
        white = Image.new("RGBA", im.size, (255, 255, 255, 0))
        white.putalpha(a)
        im = trim_alpha(white)
        # carré + 6 % de marge, centré
        side = round(max(im.size) * 1.12)
        canvas = Image.new("RGBA", (side, side), (255, 255, 255, 0))
        canvas.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
        canvas = canvas.resize((512, 512), Image.LANCZOS)
        Path(dst).parent.mkdir(parents=True, exist_ok=True)
        canvas.save(dst, optimize=True)
        print(f"  {dst}")


PHOTOS_MAP = [
    ("Les Myconautes WEB cagette.png", "cagette-eryngii.jpg", (1920, 800)),
    ("Les Myconautes WEB substrat eryngii FV.png", "substrat-eryngii-fructification.jpg", (1920, 800)),
    ("Les Myconautes WEB barquette eryngii.png", "barquette-eryngii.jpg", (1200, 1200)),
    ("Les Myconautes WEB bocal pickles eryngii.png", "bocal-pickles-eryngii.jpg", (1200, 1200)),
    ("Les Myconautes WEB sac substrat eryngii.png", "sac-substrat-eryngii.jpg", (1200, 1200)),
]


def trim_flat(im, margin=0.02, tol=6):
    """Retire l'aplat uni autour du sujet, en gardant `margin` de marge."""
    bg = im.getpixel((3, 3))
    px = im.load()
    w, h = im.size
    diff = Image.new("L", im.size)
    dpx = diff.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            dpx[x, y] = 255 if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > tol else 0
    box = diff.getbbox()
    if not box:
        return im
    m = round(margin * max(box[2] - box[0], box[3] - box[1]))
    box = (max(0, box[0] - m), max(0, box[1] - m), min(w, box[2] + m), min(h, box[3] + m))
    print(f"    trim {im.size} -> {box[2]-box[0]}x{box[3]-box[1]}")
    return im.crop(box)


def prep_photos():
    for src, dst, size in PHOTOS_MAP:
        im = trim_flat(Image.open(SRC / src).convert("RGB"))
        ratio = min(size[0] / im.size[0], size[1] / im.size[1])
        im = im.resize((round(im.size[0] * ratio), round(im.size[1] * ratio)), Image.LANCZOS)
        im.save(PHOTOS / dst, quality=92, subsampling=0, optimize=True, progressive=True)
        print(f"  {dst} {size} {round((PHOTOS / dst).stat().st_size / 1024)} ko  fond={im.getpixel((3, 3))}")


if __name__ == "__main__":
    if not SRC.is_dir():
        sys.exit("lancer depuis la racine du repo lesmyconautes-website")
    print("logos :"); split_logos()
    print("pictos :"); prep_pictos()
    print("photos :"); prep_photos()
