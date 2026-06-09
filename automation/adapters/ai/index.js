// automation/adapters/ai/index.js
import { generateWithCloudflare } from "./cloudflare.js";

export async function generatePredictionText(prompt) {
  return generateWithCloudflare(prompt);
}