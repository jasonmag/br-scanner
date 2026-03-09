from __future__ import annotations

import io
from typing import Iterable

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageEnhance, ImageOps
from pyzbar.pyzbar import Decoded, ZBarSymbol, decode

app = FastAPI(title="br-scanner-decoder")

MAX_IMAGE_BYTES = 2 * 1024 * 1024
SUPPORTED_SYMBOLS = [
    ZBarSymbol.EAN13,
    ZBarSymbol.EAN8,
    ZBarSymbol.UPCA,
    ZBarSymbol.UPCE,
    ZBarSymbol.CODE128,
    ZBarSymbol.CODE39,
    ZBarSymbol.I25,
    ZBarSymbol.QRCODE,
]

FORMAT_MAP = {
    "EAN13": "ean_13",
    "EAN8": "ean_8",
    "UPCA": "upc_a",
    "UPCE": "upc_e",
    "CODE128": "code_128",
    "CODE39": "code_39",
    "I25": "itf",
    "QRCODE": "qr_code",
}


def build_variants(image: Image.Image) -> Iterable[tuple[Image.Image, float]]:
    rgb_image = image.convert("RGB")
    grayscale = ImageOps.grayscale(rgb_image)
    high_contrast = ImageEnhance.Contrast(grayscale).enhance(1.6)

    for base_image, confidence in ((rgb_image, 0.88), (high_contrast, 0.82)):
        for degrees in (0, 90, 180, 270):
            yield base_image.rotate(degrees, expand=True), confidence


def normalize_result(decoded: Decoded, confidence: float) -> dict[str, object] | None:
    try:
        value = decoded.data.decode("utf-8")
    except UnicodeDecodeError:
        value = decoded.data.decode("latin-1", errors="ignore")

    if not value:
        return None

    return {
        "value": value,
        "format": FORMAT_MAP.get(decoded.type, "unknown"),
        "confidence": confidence,
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/decode")
async def decode_barcode(image: UploadFile = File(...)) -> dict[str, list[dict[str, object]]]:
    payload = await image.read()
    if len(payload) == 0:
        raise HTTPException(status_code=400, detail="Image upload is empty.")

    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 2 MB limit.")

    try:
        source_image = Image.open(io.BytesIO(payload))
        source_image.load()
    except Exception as error:  # pragma: no cover - Pillow raises multiple concrete types.
        raise HTTPException(status_code=400, detail="Invalid image payload.") from error

    seen_values: set[str] = set()
    results: list[dict[str, object]] = []

    for variant, confidence in build_variants(source_image):
        for decoded in decode(variant, symbols=SUPPORTED_SYMBOLS):
            normalized = normalize_result(decoded, confidence)
            if not normalized:
                continue

            value = normalized["value"]
            if value in seen_values:
                continue

            seen_values.add(value)
            results.append(normalized)

        if results:
            break

    return {"results": results}
