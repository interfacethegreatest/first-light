"""Make the explicitly downsampled Earth icon derivative; retain all originals.

Development-only requirements: installed Pillow, Node, and the existing packer.
The temporary glTF/BIN retain their original bytes. Only its staged JPEG differs.
"""

import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

import PIL
from PIL import Image, features


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/media/earth"
TEXTURE = "textures/Scene_-_Root_baseColor.jpeg"
EXPECTED_BLOBS = {
    "earth.gltf": "b6b4f0e0e5800e2e59ffaefca0e9fb31e616f1ce",
    "earth.bin": "ec3f96c2e3945e55dabfaecf7200423d68d268d4",
    TEXTURE: "05dede73ba99f70be4ea4b87b22e167b5fbd840a",
}


def identity(data):
    return {
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "gitBlob": hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest(),
    }


def main():
    originals = {path: (ASSETS / path).read_bytes() for path in EXPECTED_BLOBS}
    for path, expected in EXPECTED_BLOBS.items():
        if identity(originals[path])["gitBlob"] != expected:
            raise ValueError(f"Original source blob differs: {path}")

    icon_directory = ASSETS / "icon"
    icon_directory.mkdir(parents=True, exist_ok=True)
    texture_path = icon_directory / "Scene_-_Root_baseColor.jpeg"
    with Image.open(ASSETS / TEXTURE) as image:
        if image.mode != "RGB" or image.size != (8192, 4096):
            raise ValueError("Expected the pinned 8192×4096 RGB source JPEG")
        options = {"quality": 90, "subsampling": 2, "optimize": False, "progressive": False}
        # Retain the source RGB interpretation; do not apply an automatic color transform.
        if image.info.get("icc_profile"):
            options["icc_profile"] = image.info["icc_profile"]
        resized = image.resize((1024, 512), resample=Image.Resampling.LANCZOS)
        resized.save(texture_path, format="JPEG", **options)
        resized.close()

    derivative_bytes = texture_path.read_bytes()
    with tempfile.TemporaryDirectory(prefix="first-light-earth-icon-") as directory:
        staging = Path(directory)
        (staging / "earth.gltf").write_bytes(originals["earth.gltf"])
        (staging / "earth.bin").write_bytes(originals["earth.bin"])
        (staging / "textures").mkdir()
        (staging / TEXTURE).write_bytes(derivative_bytes)
        packed = subprocess.run(
            ["node", str(ROOT / "scripts/pack-moon-glb.mjs"),
             str(staging / "earth.gltf"), str(ASSETS / "earth-icon.glb")],
            check=True, capture_output=True, text=True,
        )

    report = {
        "schemaVersion": 1,
        "kind": "locally-downsampled-rendering-derivative",
        "sourceRevision": "7b7e533e587d4991c97b63259355d1a5e9141616",
        "tool": {
            "name": "scripts/prepare-earth-icon.py",
            "pillowVersion": PIL.__version__,
            "jpegLibraryVersion": features.version_codec("jpg"),
            "packer": "scripts/pack-moon-glb.mjs (reused unchanged)",
        },
        "sourceImage": {"file": TEXTURE, **identity(originals[TEXTURE]), "width": 8192, "height": 4096},
        "image": {"file": "icon/Scene_-_Root_baseColor.jpeg", **identity(derivative_bytes), "width": 1024, "height": 512},
        "output": {"file": "earth-icon.glb", **identity((ASSETS / "earth-icon.glb").read_bytes())},
        "resize": {
            "filter": "LANCZOS", "jpegQuality": 90, "chromaSubsampling": "4:2:0",
            "optimize": False, "progressive": False, "colorMode": "RGB",
            "sourceHasIccProfile": False, "colorTransformApplied": False,
            "textureRgba8BaseLevelBytes": 1024 * 512 * 4,
        },
        "preservation": {
            "originalFilesModified": False,
            "stagedGltfAndBinByteIdentical": True,
            "geometrySimplified": False, "indicesConverted": False,
            "transformsBaked": False, "uvOrMaterialChanges": False,
            "imageBytesIdenticalToOriginal": False,
            "note": "Only the staged JPEG is replaced. Its relative URI remains the same inside the temporary source package; the icon pack report identifies derivative image bytes, not original image bytes.",
        },
    }
    (icon_directory / "preparation-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(packed.stdout.strip())
    print(json.dumps({"derivativeImage": report["image"], "output": report["output"], "rgba8BaseLevelBytes": 2097152}, indent=2))


if __name__ == "__main__":
    main()
