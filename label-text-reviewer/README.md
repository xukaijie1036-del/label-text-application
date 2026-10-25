# Label Text Reviewer

A small web application for uploading a label photograph, extracting text with Google Cloud Vision OCR, reviewing the image and text side by side, correcting OCR errors, and copying the corrected text.

## Features

- Side-by-side original image and editable OCR text
- Google Cloud Vision document text detection
- Image zoom controls
- Copy corrected text
- Responsive layout for desktop and mobile
- No database and no permanent image storage in this application
- FastAPI health endpoint at `/health`

## Architecture

Browser → FastAPI application → Google Cloud Vision OCR API → editable text in browser.

The browser uploads the image to the backend. The backend sends the image bytes to Google Cloud Vision and returns the detected text. The application does not save uploaded images or extracted text to a database. The hosting provider may still keep normal operational logs; do not upload sensitive labels unless your data-handling requirements permit it.

## Requirements

- Python 3.11 or later for local development (Docker uses Python 3.12)
- A Google Cloud project
- Billing enabled for the project
- Google Cloud Vision API enabled
- Application Default Credentials locally, or a service account identity for Cloud Run

## Run locally

### 1. Create and activate a virtual environment

Windows PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Google Cloud credentials

Create or select a Google Cloud project, enable billing, and enable the **Cloud Vision API**.

For local development, install the Google Cloud CLI and sign in with Application Default Credentials:

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

Google's local authentication guide:
https://cloud.google.com/docs/authentication/provide-credentials-adc

Do not commit service-account key files or credentials to GitHub.

### 4. Start the application

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

Open http://127.0.0.1:8080 in your browser.

## Deploy to Google Cloud Run (recommended)

This deployment uses Cloud Run's managed runtime identity instead of downloading a service-account JSON key. The commands below use the Google Cloud CLI (`gcloud`). Run them in a terminal where the CLI is installed and authenticated.

### 1. Set project and region

Replace `YOUR_PROJECT_ID` with your actual Google Cloud project ID:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-central1
```

If you do not have a Google Cloud project, create one in the Google Cloud Console first and link a billing account. Project IDs are unique and cannot be changed later.

### 2. Enable the required APIs

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com vision.googleapis.com
```

### 3. Create a dedicated runtime service account

```bash
gcloud iam service-accounts create label-reviewer-runtime \
  --display-name="Label Reviewer Cloud Run runtime"
```

Grant it permission to call the Vision API:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:label-reviewer-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/vision.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:label-reviewer-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

Depending on your organization's IAM policy, an administrator may need to grant these roles. The Vision role permits OCR requests; Service Usage Consumer supports using the project for quota/billing. Avoid broad Owner or Editor roles for the application service account.

### 4. Deploy from this folder

From the folder containing `Dockerfile`, run:

```bash
gcloud run deploy label-text-reviewer \
  --source . \
  --region us-central1 \
  --service-account label-reviewer-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60
```

Replace both occurrences of `YOUR_PROJECT_ID`. The first deployment may take several minutes while Google builds the container.

The command prints a service URL, typically shaped like:

```text
https://label-text-reviewer-xxxxx-uc.a.run.app
```

Open that URL to use the app.

**Public access warning:** `--allow-unauthenticated` makes the website reachable by anyone who has its URL. This starter app does not include a login page or rate limiting. Before using it with confidential labels or relying on it for ongoing public use, add authentication and abuse protections. You can remove public access later with IAM configuration, but the user experience then requires an authenticated identity.

### 5. Confirm the deployment

Open the URL and upload a test image. You can also visit:

```text
https://YOUR_CLOUD_RUN_URL/health
```

Expected response:

```json
{"status":"ok"}
```

If OCR fails, check that the Vision API is enabled, billing is active, and the Cloud Run runtime service account has permission to use Google APIs. Check the Cloud Run logs in Google Cloud Console.

## Optional: deploy using the Google Cloud Console

The CLI `--source .` workflow is usually the simplest repeatable route. If using the console, you can connect a source repository and deploy a Cloud Run service from source. Configure the same runtime service account and public-access policy described above.

## Cost notes

Cloud Run, Cloud Build, Artifact Registry, and Cloud Vision may incur charges depending on usage, region, and current free-tier eligibility. Review current pricing before deployment:

- Cloud Run: https://cloud.google.com/run/pricing
- Vision: https://cloud.google.com/vision/pricing
- Cloud Build: https://cloud.google.com/build/pricing
- Artifact Registry: https://cloud.google.com/artifact-registry/pricing

Set a budget alert in Google Cloud Billing. Budget alerts notify you; they do not automatically cap spending.

## Security and limitations

- The sample intentionally does not store uploaded images or OCR results in a database.
- The app has no authentication by default. Public URL access means anyone can try to use the OCR endpoint and consume quota.
- For a real public deployment, add authentication, rate limiting, monitoring, and appropriate abuse controls.
- Use a strict upload size limit and only supported image MIME types.
- OCR is imperfect. A human must review characters that look alike, such as `O`/`0`, `I`/`1`, and `B`/`8`.
- Google Cloud Vision processes image content. Confirm your privacy and compliance requirements before uploading sensitive labels.
- Do not commit credentials or service-account JSON keys to source control.

## Project files

```text
label-text-reviewer/
├── main.py
├── requirements.txt
├── Procfile
├── Dockerfile
├── .dockerignore
├── .gitignore
├── README.md
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```
