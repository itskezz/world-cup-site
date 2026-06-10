// automation/lib/safeJson.js
function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response");
  }

  return trimmed.slice(start, end + 1);
}

function stripInvalidControlCharacters(jsonText) {
  return jsonText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function escapeRawNewlinesInsideStrings(jsonText) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (const char of jsonText) {
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      output += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      output += char;
      continue;
    }

    if (inString && char === "\n") {
      output += "\\n";
      continue;
    }

    if (inString && char === "\r") {
      output += "\\r";
      continue;
    }

    if (inString && char === "\t") {
      output += "\\t";
      continue;
    }

    output += char;
  }

  return output;
}

export function parseJsonObject(text) {
  const extracted = extractJsonObject(text);
  const withoutControls = stripInvalidControlCharacters(extracted);
  const escaped = escapeRawNewlinesInsideStrings(withoutControls);

  return JSON.parse(escaped);
}