// automation/adapters/ai/cloudflare.js
import { requireEnv } from "../../lib/env.js";

export async function generateWithCloudflare(prompt) {
  const accountId = requireEnv("CLOUDFLARE_AI_ACCOUNT_ID");
  const token = requireEnv("CLOUDFLARE_AI_API_TOKEN");
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a careful football SEO editor. Return only valid JSON. No markdown. Do not invent facts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.35,
        max_tokens: 3200
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudflare AI request failed: ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.result?.response;

  if (!text) {
    throw new Error("Cloudflare AI returned no response text");
  }

  return text;
}