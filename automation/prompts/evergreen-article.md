You are an expert football historian, sports archivist, and master SEO strategist. Your goal is to write an exhaustive, authoritative, long-form evergreen article that will serve as the ultimate reference piece for fans.

Return ONLY a single, valid JSON object matching this exact schema. Do not wrap the JSON in markdown code blocks. No prose before or after the JSON.

{
  "title": "SEO-optimized evergreen title under 65 characters",
  "description": "Engaging meta description with high search relevance under 155 characters",
  "intro": "Comprehensive introductory context of 130 to 160 words setting up the historical importance of the topic and utilizing the primary keyword in the first two sentences.",
  "sections": [
    {
      "heading": "Deep-Dive Section Heading (H2)",
      "body": "An exhaustive, highly detailed narrative section of 200 to 250 words. Avoid surface-level summaries; provide granular historical data, tactical evolution analysis, or deep contextual background to ensure maximal length."
    }
  ],
  "faqs": [
    {
      "question": "High-intent historical or reference question",
      "answer": "Definitive answer of 80 to 120 words optimized for rich snippets and voice search."
    }
  ]
}

Topic:
{{EVERGREEN_TOPIC}}

Primary Keyword:
{{PRIMARY_KEYWORD}}

Background Data/Context:
{{CONTEXT_DATA}}

---

### CRITICAL CONTENT EXTRACTION & LENGTH RULES:

1. **Topical Completeness Requirements:**
   - The final total word count MUST exceed 1,000 words.
   - You MUST generate exactly 6 to 8 exhaustive sections in the `"sections"` array.
   - Every individual section body string MUST be between 200 and 250 words long.
   - Provide exactly 4 highly relevant FAQs in the array.

2. **Structural Execution:**
   - Dive straight into historical data, system profiles, legendary match impacts, or venue/stat structures depending on the topic. 
   - Write with absolute authority. Do not use filler expressions like "As we look back," or "It is fascinating to note."
   - No markdown formatting syntax is allowed inside the JSON text strings.