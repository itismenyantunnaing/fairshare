/**
 * Server-side certificate verification.
 * Scores the OCR text extracted on the client side to determine
 * if the image looks like a legitimate hostel certificate/license.
 *
 * Uses a tiered keyword system:
 * - Primary keywords: Strong certificate indicators (certificate, license, permit, etc.)
 * - Authority keywords: Government/official body terms (government, ministry, department, etc.)
 * - Domain keywords: Hostel/tourism specific terms (hostel, accommodation, tourism, etc.)
 *
 * Requires matches from MULTIPLE categories to pass verification.
 *
 * @param {string} ocrText - Text extracted from the image via client-side Tesseract.js
 * @param {number} ocrConfidence - OCR confidence score (0-100)
 * @returns {object} Verification result with isLegit flag and analysis details
 */
export function verifyCertificateText(ocrText, ocrConfidence = 0) {
  const fullText = (ocrText || "").toLowerCase();

  // Primary keywords — these directly indicate a certificate/license document
  const primaryKeywords = [
    "certificate",
    "license",
    "licence",
    "permit",
    "certified",
    "registration",
    "registered",
    "authorized",
    "authorised",
  ];

  // Authority keywords — indicate an official/government issuing body
  const authorityKeywords = [
    "government",
    "ministry",
    "department",
    "authority",
    "bureau",
    "municipal",
    "council",
    "board",
    "official",
    "republic",
    "state",
  ];

  // Domain keywords — hostel/tourism industry specific
  const domainKeywords = [
    "hostel",
    "accommodation",
    "tourism",
    "hotel",
    "lodging",
    "guest house",
    "guesthouse",
  ];

  // Document action keywords — terms used in official documents
  const documentKeywords = [
    "issued",
    "granted",
    "valid",
    "approved",
    "regulation",
    "compliance",
    "inspection",
    "hereby",
    "certify",
    "accordance",
    "pursuant",
    "expire",
    "renewal",
  ];

  // Count matches per category
  const matchedPrimary = [];
  const matchedAuthority = [];
  const matchedDomain = [];
  const matchedDocument = [];

  for (const kw of primaryKeywords) {
    if (fullText.includes(kw)) matchedPrimary.push(kw);
  }
  for (const kw of authorityKeywords) {
    if (fullText.includes(kw)) matchedAuthority.push(kw);
  }
  for (const kw of domainKeywords) {
    if (fullText.includes(kw)) matchedDomain.push(kw);
  }
  for (const kw of documentKeywords) {
    if (fullText.includes(kw)) matchedDocument.push(kw);
  }

  const allMatched = [
    ...matchedPrimary,
    ...matchedAuthority,
    ...matchedDomain,
    ...matchedDocument,
  ];

  // Score calculation with weighted categories
  let score = 0;

  // Primary keywords are worth the most (10 points each)
  score += matchedPrimary.length * 10;

  // Authority keywords (7 points each)
  score += matchedAuthority.length * 7;

  // Domain keywords (8 points each)
  score += matchedDomain.length * 8;

  // Document action keywords (5 points each)
  score += matchedDocument.length * 5;

  // Small bonus for text length (reduced from before — not enough alone)
  if (fullText.length > 100) score += 3;
  if (fullText.length > 300) score += 2;

  // Determine categories matched
  const categoriesMatched =
    (matchedPrimary.length > 0 ? 1 : 0) +
    (matchedAuthority.length > 0 ? 1 : 0) +
    (matchedDomain.length > 0 ? 1 : 0) +
    (matchedDocument.length > 0 ? 1 : 0);

  // STRICT RULES:
  // 1. Must have at least 1 primary keyword (certificate, license, permit, etc.)
  // 2. Must match keywords from at least 2 different categories
  // 3. Must have a score of at least 25
  const hasPrimaryKeyword = matchedPrimary.length > 0;
  const hasMultipleCategories = categoriesMatched >= 2;
  const meetsScoreThreshold = score >= 25;

  const isLegit = hasPrimaryKeyword && hasMultipleCategories && meetsScoreThreshold;

  // --- Extract structured fields from OCR text ---
  const originalText = ocrText || "";

  // Extract registration/license number (must contain at least one digit)
  const regNoPatterns = [
    /(?:registration|license|licence|permit|ref|certificate)\s*(?:no|number|#|:)[.:\s#]*([A-Z0-9][\w\-\/]{2,20})/i,
    /(?:no|number)[.:\s#]+([A-Z0-9][\w\-\/]{2,20})/i,
    /\b([A-Z]{2,5}[\-\/]?\d{3,10}[\-\/]?\d{0,6})\b/,
    /#\s*([A-Z0-9][\w\-\/]{2,20})/i,
  ];
  let registrationNo = null;
  for (const pattern of regNoPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      // Must contain at least one digit to be a valid registration number
      if (/\d/.test(candidate)) {
        registrationNo = candidate;
        break;
      }
    }
  }

  // Extract dates (various formats)
  const datePatterns = [
    /(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4})/g,
    /(\w+\s+\d{1,2},?\s+\d{4})/g,
    /(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})/g,
    /(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/g,
  ];
  const allDates = [];
  for (const pattern of datePatterns) {
    const matches = originalText.matchAll(pattern);
    for (const m of matches) {
      const d = m[1].trim();
      if (d.length >= 6 && !allDates.includes(d)) {
        allDates.push(d);
      }
    }
  }

  // Try to identify issue date and expiry date
  let issueDate = null;
  let expiryDate = null;

  const issueDateMatch = originalText.match(
    /(?:date\s*of\s*issue|issued?\s*(?:on|date)?|effective\s*date)[:\s]*([^\n]{6,30})/i
  );
  if (issueDateMatch) issueDate = issueDateMatch[1].trim();

  const expiryDateMatch = originalText.match(
    /(?:valid\s*until|expir(?:y|es|ation)\s*(?:date)?|valid\s*(?:through|to|thru)|expire[sd]?\s*(?:on)?)[:\s]*([^\n]{6,30})/i
  );
  if (expiryDateMatch) expiryDate = expiryDateMatch[1].trim();

  // If no labeled dates found, use extracted dates as fallback
  if (!issueDate && allDates.length > 0) issueDate = allDates[0];
  if (!expiryDate && allDates.length > 1) expiryDate = allDates[1];

  // Extract authorized by / issuing authority
  let authorizedBy = null;
  const authPatterns = [
    /(?:authorized\s*by|authorised\s*by|issued\s*by|signed\s*by|approved\s*by|authority)[:\s]*([^\n]{3,60})/i,
    /(?:department\s*of|ministry\s*of|bureau\s*of|office\s*of)[^\n]{0,60}/i,
  ];
  for (const pattern of authPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      authorizedBy = match[0].trim();
      break;
    }
  }

  return {
    isLegit,
    score,
    confidence: Math.round(ocrConfidence),
    matchedKeywords: allMatched,
    matchedLabels: [],
    detectedLabels: [],
    textLength: fullText.length,
    textPreview: fullText.substring(0, 300),
    extractedFields: {
      registrationNo,
      issueDate,
      expiryDate,
      authorizedBy,
      datesFound: allDates,
    },
    details: {
      primaryMatches: matchedPrimary,
      authorityMatches: matchedAuthority,
      domainMatches: matchedDomain,
      documentMatches: matchedDocument,
      categoriesMatched,
      hasPrimaryKeyword,
    },
  };
}
