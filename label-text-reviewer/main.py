import base64
import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from google.cloud import vision

APP_DIR = Path(__file__).parent
STATIC_DIR = APP_DIR / "static"
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"}

app = FastAPI(title="Label Text Reviewer", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
async def home():
    return (STATIC_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/ocr")
async def extract_text(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, WEBP, GIF, BMP, or TIFF image.")
    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"Image is too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.document_text_detection(image=image)
        if response.error.message:
            raise RuntimeError(response.error.message)

        annotation = response.full_text_annotation
        text = annotation.text if annotation and annotation.text else ""
        blocks = []
        if annotation:
            for page in annotation.pages:
                for block in page.blocks:
                    vertices = block.bounding_box.vertices
                    xs = [v.x for v in vertices]
                    ys = [v.y for v in vertices]
                    blocks.append({
                        "text": "".join(
                            "".join(symbol.text for symbol in word.symbols) + " "
                            for paragraph in block.paragraphs
                            for word in paragraph.words
                        ).strip(),
                        "box": {
                            "x": min(xs) if xs else 0,
                            "y": min(ys) if ys else 0,
                            "width": (max(xs) - min(xs)) if xs else 0,
                            "height": (max(ys) - min(ys)) if ys else 0,
                        },
                        "confidence": round(sum(
                            word.confidence for paragraph in block.paragraphs for word in paragraph.words
                        ) / max(1, sum(len(paragraph.words) for paragraph in block.paragraphs)), 3)
                    })

        return {"text": text, "blocks": blocks, "filename": Path(file.filename or "label-image").name}
    except Exception as exc:
        # Do not expose implementation details or credentials to the browser.
        print(f"OCR request failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="OCR could not process this image. Check the Cloud Vision API, billing, and service-account permissions."
        ) from exc
