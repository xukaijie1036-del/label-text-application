const imageInput = document.getElementById("imageInput");
const fileName = document.getElementById("fileName");
const extractBtn = document.getElementById("extractBtn");
const previewImage = document.getElementById("previewImage");
const emptyImage = document.getElementById("emptyImage");
const imageViewport = document.getElementById("imageViewport");
const ocrText = document.getElementById("ocrText");
const statusBox = document.getElementById("status");
const textCount = document.getElementById("textCount");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");
const fitImage = document.getElementById("fitImage");
const zoomLevel = document.getElementById("zoomLevel");
const clearBtn = document.getElementById("clearBtn");

let currentFile = null;
let objectUrl = null;
let zoom = 1;

function setStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`.trim();
}
function updateCount() {
  const count = ocrText.value.length;
  textCount.textContent = `${count.toLocaleString()} character${count === 1 ? "" : "s"}`;
  copyBtn.disabled = count === 0;
}
function setZoom(value) {
  zoom = Math.min(3, Math.max(0.5, value));
  zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  previewImage.style.width = zoom === 1 ? "auto" : `${zoom * 100}%`;
  previewImage.style.maxWidth = zoom === 1 ? "100%" : "none";
  previewImage.style.maxHeight = zoom === 1 ? "100%" : "none";
  previewImage.classList.toggle("zoomed", zoom !== 1);
  zoomIn.disabled = !currentFile || zoom >= 3;
  zoomOut.disabled = !currentFile || zoom <= 0.5;
  fitImage.disabled = !currentFile;
}
function setPreview(file) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  previewImage.src = objectUrl;
  previewImage.hidden = false;
  emptyImage.hidden = true;
  currentFile = file;
  setZoom(1);
  zoomIn.disabled = false;
  zoomOut.disabled = false;
  fitImage.disabled = false;
}
imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setStatus("The image is larger than 10 MB. Choose a smaller image.", "error");
    imageInput.value = "";
    return;
  }
  setPreview(file);
  fileName.textContent = file.name;
  ocrText.value = "";
  updateCount();
  copyStatus.textContent = "";
  extractBtn.disabled = false;
  setStatus("Image ready. Select “Extract text” to run OCR.");
});

extractBtn.addEventListener("click", async () => {
  if (!currentFile) return;
  extractBtn.disabled = true;
  extractBtn.textContent = "Extracting…";
  setStatus("Extracting text from the image. This may take a few seconds.");
  copyStatus.textContent = "";
  try {
    const form = new FormData();
    form.append("file", currentFile, currentFile.name);
    const response = await fetch("/api/ocr", { method: "POST", body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || "Text extraction failed.");
    ocrText.value = result.text || "";
    updateCount();
    if (result.text) {
      setStatus("OCR complete. Review and correct the extracted text against the image.", "success");
      ocrText.focus();
    } else {
      setStatus("No text was detected. Try a clearer, closer, well-lit image.", "error");
    }
  } catch (error) {
    setStatus(error.message || "Something went wrong while extracting text.", "error");
  } finally {
    extractBtn.disabled = !currentFile;
    extractBtn.textContent = "Extract text";
  }
});

ocrText.addEventListener("input", updateCount);
zoomIn.addEventListener("click", () => setZoom(zoom + 0.25));
zoomOut.addEventListener("click", () => setZoom(zoom - 0.25));
fitImage.addEventListener("click", () => {
  setZoom(1);
  imageViewport.scrollTo({ top: 0, left: 0, behavior: "smooth" });
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(ocrText.value);
    copyStatus.textContent = "Corrected text copied to clipboard.";
  } catch {
    ocrText.focus();
    ocrText.select();
    copyStatus.textContent = "Clipboard access was unavailable. Text is selected; use Ctrl+C to copy.";
  }
});

clearBtn.addEventListener("click", () => {
  imageInput.value = "";
  currentFile = null;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  previewImage.removeAttribute("src");
  previewImage.hidden = true;
  previewImage.style.width = "auto";
  previewImage.style.maxWidth = "100%";
  previewImage.style.maxHeight = "100%";
  previewImage.classList.remove("zoomed");
  emptyImage.hidden = false;
  fileName.textContent = "No image selected";
  ocrText.value = "";
  extractBtn.disabled = true;
  zoomIn.disabled = true;
  zoomOut.disabled = true;
  fitImage.disabled = true;
  zoom = 1;
  zoomLevel.textContent = "100%";
  copyStatus.textContent = "";
  updateCount();
  setStatus("Choose an image to begin.");
});
updateCount();
