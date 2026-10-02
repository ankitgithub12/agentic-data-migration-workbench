import { LLMProvider } from './LLMProvider.js';
import { logger } from '../../config/logger.js';

export class GeminiProvider extends LLMProvider {
  constructor({ apiKey, model = 'gemini-3.8-flash', baseUrl }) {
    super();
    this.apiKey = apiKey;
    this.model = model || 'gemini-3.8-flash';
    this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generatePlan({ sourceSchema, targetSchema, sampleRecords = [], supportedTransformations = [] }) {
    if (!this.apiKey) {
      throw new Error('LLM_API_KEY is not configured for Gemini provider.');
    }

    const prompt = `
You are an expert data migration agent. Analyze the provided source schema, target schema, sample source records, and supported transformations.
Propose field mappings, identify risks, draft clarification questions, and outline the migration plan.

Source Schema:
${JSON.stringify(sourceSchema, null, 2)}

Target Schema:
${JSON.stringify(targetSchema, null, 2)}

Sample Records (First 5 records):
${JSON.stringify(sampleRecords.slice(0, 5), null, 2)}

Supported Transformations (You MUST ONLY suggest transformations from this exact list! Arbitrary code is strictly prohibited):
${JSON.stringify(supportedTransformations, null, 2)}

IMPORTANT RULES:
1. Every mapping transformation MUST be one of the supported transformations listed above.
2. Provide a confidence between 0.0 and 1.0 (do not present confidence as guaranteed truth).
3. Identify unmapped required fields as risks.
4. Output STRICT JSON conforming to the following structure:
{
  "mappings": [
    {
      "sourceField": "string",
      "targetField": "string",
      "transformation": "STRING_TRIM",
      "confidence": 0.95,
      "reason": "string",
      "transformationConfig": {}
    }
  ],
  "unmappedSourceFields": ["string"],
  "unmappedTargetFields": ["string"],
  "risks": [
    {
      "level": "LOW|MEDIUM|HIGH|CRITICAL",
      "field": "string",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "clarificationQuestions": [
    {
      "id": "q1",
      "question": "string",
      "category": "string",
      "resolved": false,
      "answer": ""
    }
  ],
  "migrationPlan": {
    "steps": [
      {
        "order": 1,
        "title": "string",
        "description": "string"
      }
    ]
  }
}
`;

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ event: 'GEMINI_API_ERROR', status: response.status, error: errText }, 'Gemini API call failed');
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('Gemini API returned empty response candidate.');
    }

    return JSON.parse(candidate);
  }
}
