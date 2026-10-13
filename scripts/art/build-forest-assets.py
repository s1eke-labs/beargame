#!/usr/bin/env python3
"""Extract only reviewed forest-chapter sprites from the retained full art sources.

This is a deterministic asset extraction step, not an art repaint: no pixel is
resized, recolored, drawn, or composited. Atlas crops are encoded losslessly.
Only two already standalone, chapter-safe illustrations are copied whole.

Run from any directory:
    python scripts/art/build-forest-assets.py
    python scripts/art/build-forest-assets.py --check

The shipped inventory contains output paths/hashes only. Source atlas names and
their unused subjects stay in this development helper and the full source tree.
"""

import argparse
import hashlib
import io
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public/chapters/forest"
REGISTRY = ROOT / "src/chapters/forest/art.js"
PREFIX = "./chapters/forest/"

# These are positive allowlists, not denylist filters over a full catalogue.
BUILDINGS = {
    "hive": "beehive", "hut": "bearHut", "library": "library",
    "barn": "barn", "mine": "mine", "smelter": "forge",
    "logHouse": "loghouse", "warehouse": "warehouse",
    "lumberMill": "logyard",
}
GROWTH = {
    "hive": "apiary", "hut": "expandedHut", "library": "expandedLibrary",
    "barn": "granary", "lumberMill": "expandedLumberyard",
    "workshop": "expandedWorkshop", "warehouse": "expandedWarehouse",
}
RESEARCH = {
    "calendar": "seasons", "agriculture": "agriculture", "archery": "hunting",
    "mining": "mining", "metal": "metallurgy", "animal": "husbandry",
    "construction": "construction",
}
RESOURCES = {
    "honey": "honey", "wood": "wood", "minerals": "stone",
    "iron": "iron", "science": "science",
}
SEMANTIC_RESOURCES = ("manpower", "furs", "ivory", "unicorns", "beam", "slab")
JOBS = ("woodcutter", "farmer", "scholar", "hunter", "miner")
BEARS = ("idleFront", "wave")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify_image_container(data, name):
    """Reject hidden metadata, animations, appended payloads, and malformed RIFF."""
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP" or int.from_bytes(data[4:8], "little") + 8 != len(data):
        raise ValueError(f"Invalid WebP container: {name}")
    offset = 12
    image_chunks = 0
    while offset < len(data):
        tag = data[offset:offset + 4]
        if tag not in {b"VP8X", b"ALPH", b"VP8 ", b"VP8L"}:
            raise ValueError(f"Unapproved image metadata or animation: {name}")
        if tag in {b"VP8 ", b"VP8L"}:
            image_chunks += 1
        length = int.from_bytes(data[offset + 4:offset + 8], "little")
        offset += 8 + length + length % 2
    if offset != len(data) or image_chunks != 1:
        raise ValueError(f"Malformed or multiple image payloads: {name}")


def registry(name, export):
    """Read a data-only JSON export; never execute the full application modules."""
    source = (ROOT / "src/ui" / name).read_text()
    match = re.search(r"export const " + re.escape(export) + r"\s*=", source)
    if not match:
        raise ValueError(f"Missing data export {export} in {name}")
    value, end = json.JSONDecoder().raw_decode(source[match.end():].lstrip())
    return value


def build_assets():
    art = {key: {} for key in (
        "buildings", "growth", "resources", "research", "workers", "bears", "scenery"
    )}
    assets = {}
    inventory = []
    images = {}
    painted = registry("painted-buildings.js", "paintedBuildings")
    subjects = registry("research-art.js", "researchArt")
    semantic = registry("semantic-resources.js", "semanticResources")
    basic = registry("art-data.js", "atlasCrops")["resources-atlas"]
    outfits = registry("outfit-art.js", "outfitAtlas")
    bears = registry("bear-art.js", "bearAtlas")

    def emit(category, key, source_name, crop=None, pose=None, expected_size=None):
        source = ROOT / "public/art" / source_name
        if source_name not in images:
            with Image.open(source) as image:
                images[source_name] = image.convert("RGBA")
        original = images[source_name]
        if expected_size and tuple(expected_size) != original.size:
            raise ValueError(f"Source dimensions changed: {source_name}")
        name = f"{category}/{key}{'-' + pose if pose else ''}.webp"
        if name in assets:
            raise ValueError(f"Duplicate output {name}")
        if crop is None:
            # The only permitted whole images contain one forest subject each.
            if source_name not in {"forest-long-map.webp", "workshop-soft.webp"}:
                raise ValueError(f"Whole-sheet copying is forbidden: {source_name}")
            data = source.read_bytes()
            extracted = original
        else:
            x, y, w, h = (crop[k] for k in ("x", "y", "width", "height"))
            if not (0 <= x < x+w <= original.width and 0 <= y < y+h <= original.height):
                raise ValueError(f"Out-of-bounds crop: {name}")
            if (w, h) == original.size:
                raise ValueError(f"Atlas crop must not include the full sheet: {name}")
            extracted = original.crop((x, y, x+w, y+h))
            if not extracted.getchannel("A").getbbox():
                raise ValueError(f"Empty crop: {name}")
            stream = io.BytesIO()
            extracted.save(stream, "WEBP", lossless=True, quality=100, method=4, exact=True)
            data = stream.getvalue()
            with Image.open(io.BytesIO(data)) as decoded:
                if decoded.convert("RGBA").tobytes() != extracted.tobytes():
                    raise ValueError(f"Extracted RGBA pixels changed: {name}")
        verify_image_container(data, name)
        assets[name] = data
        url = PREFIX + name
        if pose:
            art[category].setdefault(key, {})[pose] = url
        else:
            art[category][key] = url
        inventory.append({
            "path": name, "bytes": len(data), "sha256": digest(data),
            "width": extracted.width, "height": extracted.height,
        })

    def painted_sprite(category, key, source_key):
        entry = painted[source_key]
        emit(category, key, "painted-" + entry["sheet"] + ".webp", entry["crop"],
             expected_size=(entry["width"], entry["height"]))

    for key, source_key in BUILDINGS.items():
        painted_sprite("buildings", key, source_key)
    pasture = registry("semantic-buildings.js", "semanticBuildings")["pasture"]
    emit("buildings", "pasture", "semantic-buildings.webp", pasture["crop"],
         expected_size=(pasture["width"], pasture["height"]))
    emit("buildings", "workshop", "workshop-soft.webp")
    for key, source_key in GROWTH.items():
        painted_sprite("growth", key, source_key)
    for key, source_key in RESEARCH.items():
        entry = subjects[source_key]
        emit("research", key, "research-subjects.webp", entry["crop"],
             expected_size=(entry["width"], entry["height"]))
    for key, source_key in RESOURCES.items():
        emit("resources", key, "resources-atlas.webp", basic[source_key],
             expected_size=(1254, 1254))
    for key in SEMANTIC_RESOURCES:
        entry = semantic[key]
        emit("resources", key, entry["sheet"] + ".webp", entry["crop"],
             expected_size=(entry["width"], entry["height"]))
    for key in JOBS:
        for pose in ("ready", "work"):
            entry = outfits["crops"][key + pose.title()]
            # Keep the original common 256-square frame, body anchor, and baseline.
            assert (entry["width"], entry["height"], entry["anchorX"], entry["baseline"]) == (256, 256, 112, 240)
            emit("workers", key, "worker-outfits.webp", entry, pose,
                 expected_size=(outfits["width"], outfits["height"]))
    for key in BEARS:
        emit("bears", key, "reference-bears-atlas.webp", bears["crops"][key],
             expected_size=(bears["width"], bears["height"]))
    emit("scenery", "background", "forest-long-map.webp")
    emit("scenery", "loading", "loading-bear.webp",
         {"x": 0, "y": 0, "width": 128, "height": 160}, expected_size=(256, 160))

    # Aliases contain no extra pixels or downloads.
    art["resources"]["bear"] = art["bears"]["idleFront"]
    art["workers"]["idle"] = {
        "ready": art["bears"]["idleFront"], "work": art["bears"]["idleFront"]
    }
    art["background"] = art["scenery"]["background"]
    art["loading"] = art["scenery"]["loading"]
    script = "// Forest chapter artwork. Every URL resolves to a chapter-only file.\n"
    script += "export const art = " + json.dumps(art, indent=2) + ";\n"
    script += "export const forestArt = art;\n"
    script += "export const forestAssets = " + json.dumps([PREFIX + name for name in sorted(assets)], indent=2) + ";\n"
    script += "export const forestWorkerFrame = Object.freeze({ width: 256, height: 256, anchorX: 112, baseline: 240 });\n"
    script += "export function forestImage(kind, id, pose = 'ready') {\n"
    script += "  const group = { building: 'buildings', resource: 'resources', worker: 'workers', bear: 'bears' }[kind] || kind;\n"
    script += "  const item = art[group]?.[id];\n"
    script += "  return typeof item === 'string' ? item : item?.[pose] || '';\n}\n"
    manifest = {"chapter": "forest", "version": 1,
                "totalBytes": sum(len(data) for data in assets.values()),
                "files": sorted(inventory, key=lambda item: item["path"])}
    assets["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    return assets, script.encode(), manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify without writing any files")
    args = parser.parse_args()
    assets, script, manifest = build_assets()
    actual = {str(path.relative_to(OUTPUT)) for path in OUTPUT.rglob("*") if path.is_file()} if OUTPUT.exists() else set()
    unexpected = actual - set(assets)
    if unexpected:
        raise SystemExit("Unexpected files in forest art output: " + ", ".join(sorted(unexpected)))
    if args.check:
        missing = set(assets) - actual
        if missing:
            raise SystemExit("Missing forest art files: " + ", ".join(sorted(missing)))
        for name, data in assets.items():
            if (OUTPUT / name).read_bytes() != data:
                raise SystemExit("Forest asset differs from approved extraction: " + name)
        if not REGISTRY.exists() or REGISTRY.read_bytes() != script:
            raise SystemExit("Forest art.js differs from approved allowlist")
    else:
        for name, data in assets.items():
            path = OUTPUT / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        REGISTRY.parent.mkdir(parents=True, exist_ok=True)
        REGISTRY.write_bytes(script)
    print(json.dumps({"mode": "verified" if args.check else "built", "chapter": "forest",
                      "images": len(manifest["files"]), "imageBytes": manifest["totalBytes"],
                      "inventory": "public/chapters/forest/manifest.json"}))


if __name__ == "__main__":
    main()
