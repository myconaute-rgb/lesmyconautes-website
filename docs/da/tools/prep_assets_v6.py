#!/usr/bin/env python3
"""Prépare les assets du site à partir des photos de la vague v6 (09/09/2026).

À lancer depuis la racine du repo : `python3 docs/da/tools/prep_assets_v6.py`.
Idempotent — relit toujours les originaux de `docs/da/v6-2026-09-09/`, jamais ses sorties.

Deux photos de production (pas de détourage, pas d'aplat à rogner comme en v5) :
on normalise seulement le nom, la taille max et l'encodage, et on repart d'un JPEG
sans métadonnées (les originaux n'ont déjà aucun EXIF — vérifié le 09/09).
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path("docs/da/v6-2026-09-09")
PHOTOS = Path("src/assets/photos")

# (original, destination, largeur max) — les deux sources font 1280x896.
PHOTOS_MAP = [
    ("Les Myconautes WEB substrat charriots.jpg", "incubation-charriots.jpg", 1600),
    ("Les Myconautes WEB substrat culture Florestan GRANGE.jpg", "culture-florestan.jpg", 1600),
]


def prep_photos():
    for src, dst, maxw in PHOTOS_MAP:
        im = Image.open(SRC / src).convert("RGB")
        if im.size[0] > maxw:
            h = round(im.size[1] * maxw / im.size[0])
            im = im.resize((maxw, h), Image.LANCZOS)
        # sans exif=... ni icc_profile : le JPEG écrit ne porte aucune métadonnée
        im.save(PHOTOS / dst, quality=92, subsampling=0, optimize=True, progressive=True)
        print(f"  {dst} {im.size} {round((PHOTOS / dst).stat().st_size / 1024)} ko")


if __name__ == "__main__":
    if not SRC.is_dir():
        sys.exit("lancer depuis la racine du repo lesmyconautes-website")
    print("photos :"); prep_photos()
