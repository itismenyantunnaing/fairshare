import vision from "@google-cloud/vision";

let client;

function getVisionClient() {
  if (client) return client;

  // Option 1: GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON file)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    client = new vision.ImageAnnotatorClient();
  }
  // Option 2: Individual env vars for credentials
  else if (
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL &&
    process.env.GOOGLE_CLOUD_PRIVATE_KEY
  ) {
    client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  } else {
    throw new Error(
      "Google Cloud Vision credentials not configured. " +
        "Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_CLIENT_EMAIL + GOOGLE_CLOUD_PRIVATE_KEY in .env.local"
    );
  }

  return client;
}

/**
 * Verifies a certificate image using Google Cloud Vision API.
 * Performs text detection and label detection to determine if the
 * uploaded image looks like a legitimate hostel certificate/license.
 *
 * @param {string} base64Image - Base64-encoded image (with or without data URL prefix)
 * @returns {Promise<object>} Verification result with isLegit flag and analysis details
 */
export async function verifyCertificateImage(base64Image) {
  try {
    const visionClient = getVisionClient();

    // Strip data URL prefix if present (e.g. "data:image/png;base64,")
    const imageContent = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const request = {
      image: { content: imageContent },
      features: [
        { type: "TEXT_DETECTION" },
        { type: "LABEL_DETECTION", maxResults: 20 },
        { type: "DOCUMENT_TEXT_DETECTION" },
      ],
    };

    const [result] = await visionClient.annotateImage(request);

    // Extract detected text
    const fullText =
      result.fullTextAnnotation?.text?.toLowerCase() ||
      (result.textAnnotations?.[0]?.description?.toLowerCase() ?? "");

    // Extract detected labels
    const labels = (result.labelAnnotations || []).map((l) => ({
      description: l.description.toLowerCase(),
      score: l.score,
    }));

    const labelNames = labels.map((l) => l.description);

    // Certificate/license related keywords to look for in text
    const certificateKeywords = [
      "certificate",
      "license",
      "licence",
      "registration",
      "permit",
      "authorized",
      "authorised",
      "approved",
      "government",
      "ministry",
      "official",
      "hostel",
      "accommodation",
      "tourism",
      "certified",
      "registered",
      "department",
      "authority",
      "granted",
      "issued",
      "valid",
      "regulation",
      "compliance",
      "inspection",
      "bureau",
      "municipal",
      "council",
      "board",
    ];

    // Document-related labels
    const documentLabels = [
      "document",
      "text",
      "certificate",
      "paper",
      "receipt",
      "font",
      "letter",
      "writing",
      "printed",
      "page",
      "material",
      "publication",
      "poster",
      "banner",
      "sign",
    ];

    // Score calculation
    let score = 0;
    const matchedKeywords = [];
    const matchedLabels = [];

    // Check for certificate keywords in detected text
    for (const keyword of certificateKeywords) {
      if (fullText.includes(keyword)) {
        score += 5;
        matchedKeywords.push(keyword);
      }
    }

    // Check for document-related labels
    for (const docLabel of documentLabels) {
      if (labelNames.some((l) => l.includes(docLabel))) {
        score += 3;
        matchedLabels.push(docLabel);
      }
    }

    // Bonus: Has substantial text content (certificates typically have text)
    if (fullText.length > 50) score += 10;
    if (fullText.length > 200) score += 5;
    if (fullText.length > 500) score += 5;

    // Threshold: score >= 15 means it looks like a legitimate document
    const isLegit = score >= 15;

    return {
      isLegit,
      score,
      matchedKeywords,
      matchedLabels,
      detectedLabels: labelNames,
      textLength: fullText.length,
      textPreview: fullText.substring(0, 300),
    };
  } catch (error) {
    console.error("Vision API error:", error);
    // Mark as unavailable so the API route knows this was an error, not a failed check
    return {
      isLegit: null,
      apiError: true,
      score: 0,
      error: error.message,
      matchedKeywords: [],
      matchedLabels: [],
      detectedLabels: [],
      textLength: 0,
      textPreview: "",
    };
  }
}
