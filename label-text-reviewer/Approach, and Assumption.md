# Label Text Reviewer — Approach, Tools, and Design Assumptions

## 1. Overview

The Label Text Reviewer is a lightweight web application that uses Optical Character Recognition (OCR) to extract text from label images. Its primary goal is to reduce manual transcription effort while retaining **human validation as an essential step in the process**.

The application is designed to assist users, not replace their judgment. OCR results may contain errors, particularly when labels have poor image quality, unusual fonts, small characters, or complex layouts. Users must be able to review, correct, and validate the extracted text before using it for downstream purposes.

## 2. Approach and Workflow

The solution follows a human-in-the-loop approach:

1. **Select an image:** Users upload a label image or select a built-in demo image to explore the application's capabilities.
2. **Preview the original:** The uploaded image appears on the left side of the screen, allowing users to reference the original label throughout the review process.
3. **Extract text automatically:** The application uses Google Cloud Vision API to recognize text and display the results on the right side.
4. **Review and validate:** Users compare the extracted text against the original image, identify recognition errors, and make corrections in an editable text area.
5. **Confirm and reuse:** After validating the content, users can copy the corrected text for use in another application or workflow.

**Human validation is a core design principle.** The application presents OCR output as a draft that requires review rather than as automatically verified data. This approach helps users build confidence in the tool, understand its limitations, and adopt it gradually within their existing processes.

## 3. Tools and Technologies

| Technology | Purpose |
|---|---|
| Python and FastAPI | Backend application logic and API endpoints |
| Google Cloud Vision API | Automatic text recognition from label images |
| HTML, CSS, and JavaScript | Simple, interactive web interface |
| Google Cloud Run | Hosting and public application URL |
| Docker | Application container configuration |
| Google Cloud Build and Artifact Registry | Container build and image management during deployment |

## 4. User Interface and Usability Principles

The interface should be **simple, intuitive, and easy to navigate**, minimizing the learning curve for first-time users.

- **Clear two-panel layout:** Original image on the left and editable OCR text on the right.
- **Straightforward actions:** Use clearly labeled controls such as “Upload Image,” “Extract Text,” “Review and Correct,” and “Copy Text.”
- **Visible review step:** Make it clear that extracted text needs human verification before use.
- **Minimal navigation:** Keep the primary workflow on a single page without unnecessary menus, configuration screens, or technical terminology.
- **Immediate visual feedback:** Show the selected image, OCR progress, errors, and extracted text in predictable locations.
- **Demo-friendly experience:** Provide built-in sample images so users can try the application without preparing their own files.
- **User control:** Allow users to edit the recognized text directly and copy only the version they have reviewed.

These choices are intended to encourage adoption by making the application feel like a familiar productivity tool rather than a complex technical system.

## 5. Architecture

The browser presents the user interface and manages image selection, preview, text editing, and copying. The FastAPI backend receives image uploads and requests OCR processing from Google Cloud Vision API. The resulting text is returned to the browser for human review and correction.

Google Cloud Run hosts the application. No application database is required because the initial scope is limited to displaying and copying corrected text.

## 6. Key Assumptions

- Expected usage is fewer than 100 images per day.
- The initial version is intended for a single user and does not require login.
- The application is accessible through a web browser and hosted on Google Cloud Run.
- Images are processed for OCR without intentional permanent storage by the application.
- Corrected text is not persisted in a database.
- Common image formats are supported, with an upload size limit of 10 MB in the initial implementation.
- OCR output may be inaccurate and must be validated by the user.
- Built-in demo images will be included to support demonstrations and initial user training.

## 7. Security and Operational Considerations

- Public access should be evaluated carefully because an unauthenticated endpoint can be misused and generate unexpected cloud charges.
- Google Cloud permissions should follow the principle of least privilege.
- API usage, service logs, and billing should be monitored.
- Sensitive images should only be processed after applicable privacy and data-handling requirements have been reviewed.
- Testing should include clear images and challenging examples to help users understand when additional review is necessary.

## 8. Expected Benefits

The application aims to reduce repetitive manual transcription, improve workflow efficiency, and provide a consistent way to review label information. Its most important adoption feature is the combination of automated extraction with human verification: automation reduces effort, while users retain control over the final content.

The initial application source code has been prepared. Adding the built-in demo images and corresponding selector remains outstanding, and deployment to Google Cloud Run has not yet been completed.