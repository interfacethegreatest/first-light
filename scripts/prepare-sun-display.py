"""Prepare a separate 2K Sun display texture; retain the original 4K archive.

Development-only requirements: existing Pillow, Node, and the unchanged packer.
The original archive and licence are retained. Resizing and JPEG encoding are
lossy. Encoding metrics compare against the resized reference, not the 4K source.
"""

import hashlib
import io
import json
import math
from pathlib import Path
import platform
import subprocess
import tempfile

import PIL
from PIL import Image, ImageChops, ImageStat, features


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/media/sun"
TEXTURE = "textures/Material.002_baseColor.jpeg"
EXPECTED_BLOBS = {
    "sun.gltf": "59027ee2c28798f29a02e881d79fb56c8916cd5a",
    "sun.bin": "54692cb0bc89e1895ba150e7d2fb2ee322dd7f84",
    TEXTURE: "5edf25623ea641ad36927025ea3e6e9ebab5c59f",
    "license.txt": "b9e87fd32d13f76d3e8e8de72f424d7860fba9e1",
}


def identity(data):
    return {
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "gitBlob": hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest(),
    }


def main():
    preserved = list(EXPECTED_BLOBS) + ["sun.glb", "sun.glb.pack-report.json", "sun.validation.json"]
    originals = {path: (ASSETS / path).read_bytes() for path in preserved}
    for path, expected in EXPECTED_BLOBS.items():
        if identity(originals[path])["gitBlob"] != expected:
            raise ValueError(f"Original source blob differs: {path}")

    with Image.open(io.BytesIO(originals[TEXTURE])) as image:
        if image.mode != "RGB" or image.size != (4096, 2048):
            raise ValueError("Expected the pinned 4096×2048 RGB source JPEG")
        icc = image.info.get("icc_profile")
        options = {"quality": 92, "subsampling": 0, "optimize": True, "progressive": True}
        if icc:
            options["icc_profile"] = icc
        with image.resize((2048, 1024), resample=Image.Resampling.LANCZOS) as reference:
            encoded = io.BytesIO()
            reference.save(encoded, format="JPEG", **options)
            derivative = encoded.getvalue()
            with Image.open(io.BytesIO(derivative)) as decoded:
                if decoded.mode != reference.mode or decoded.size != reference.size or decoded.info.get("icc_profile") != icc:
                    raise ValueError("Display encoding changed target dimensions, color mode, or ICC profile")
                with ImageChops.difference(reference, decoded) as difference:
                    statistics = ImageStat.Stat(difference)
                    mae = sum(statistics.mean) / 3
                    mse = sum(channel * channel for channel in statistics.rms) / 3
                    psnr = 10 * math.log10(255 * 255 / mse) if mse else None

    with tempfile.TemporaryDirectory(prefix="first-light-sun-display-") as directory:
        staging = Path(directory)
        (staging / "sun.gltf").write_bytes(originals["sun.gltf"])
        (staging / "sun.bin").write_bytes(originals["sun.bin"])
        (staging / "textures").mkdir()
        (staging / TEXTURE).write_bytes(derivative)
        packed = subprocess.run(
            ["node", str(ROOT / "scripts/pack-moon-glb.mjs"),
             str(staging / "sun.gltf"), str(ASSETS / "sun-display.glb")],
            check=True, capture_output=True, text=True,
        )

    for path, original in originals.items():
        if (ASSETS / path).read_bytes() != original:
            raise ValueError(f"Original archive was modified: {path}")

    report = {
        "schemaVersion": 1,
        "kind": "downsampled-lossy-jpeg-rendering-derivative",
        "tool": {
            "name": "scripts/prepare-sun-display.py",
            "pythonVersion": platform.python_version(),
            "pillowVersion": PIL.__version__,
            "jpegLibraryVersion": features.version_codec("jpg"),
            "nodeVersion": subprocess.run(["node", "--version"], check=True, capture_output=True, text=True).stdout.strip(),
            "packer": {"file": "scripts/pack-moon-glb.mjs", **identity((ROOT / "scripts/pack-moon-glb.mjs").read_bytes())},
        },
        "originalFiles": {path: identity(data) for path, data in originals.items()},
        "sourceImage": {"file": TEXTURE, **identity(originals[TEXTURE]), "width": 4096, "height": 2048},
        "image": {"location": "embedded JPEG in sun-display.glb; no separate published image", **identity(derivative), "width": 2048, "height": 1024},
        "output": {"file": "sun-display.glb", **identity((ASSETS / "sun-display.glb").read_bytes())},
        "jpeg": {
            "quality": 92, "chromaSubsampling": "4:4:4", "optimize": True, "progressive": True,
            "colorMode": "RGB", "sourceHasIccProfile": bool(icc), "iccProfilePreserved": True,
            "iccProfileSha256": hashlib.sha256(icc).hexdigest() if icc else None,
            "resized": True, "resizeFilter": "LANCZOS", "colorTransformApplied": False, "lossy": True,
            "decodedPixelsIdentical": mae == 0,
            "pixelErrorReference": {"width": 2048, "height": 1024, "filter": "LANCZOS", "sourceWidth": 4096, "sourceHeight": 2048},
            "pixelErrorNote": "JPEG error is measured against the resized reference, not pixel identity with the full 4K source.",
            "meanAbsoluteRgbError": round(mae, 6), "psnrDb": round(psnr, 6) if psnr is not None else None,
            "sourceTextureRgba8BaseLevelBytes": 4096 * 2048 * 4,
            "textureRgba8BaseLevelBytes": 2048 * 1024 * 4,
            "decodedTextureAllocationReduced": True, "gpuMemoryMeasured": False,
        },
        "preservation": {
            "originalFilesModified": False, "stagedGltfAndBinByteIdentical": True,
            "geometrySimplified": False, "indicesConverted": False, "transformsBaked": False,
            "uvOrMaterialChanges": False, "imageBytesIdenticalToOriginal": derivative == originals[TEXTURE],
            "note": "Only the staged JPEG is resized and re-encoded. The original 4K sun.glb, source texture, geometry and licence remain unchanged.",
        },
    }
    (ASSETS / "sun-display.preparation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(packed.stdout.strip())
    print(json.dumps({"image": report["image"], "output": report["output"], "jpeg": report["jpeg"]}, indent=2))


if __name__ == "__main__":
    main()
