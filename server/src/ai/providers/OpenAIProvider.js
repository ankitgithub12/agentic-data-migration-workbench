import { LLMProvider } from './LLMProvider.js';
import { logger } from '../../config/logger.js';

export class OpenAIProvider extends LLMProvider {
  constructor({ apiKey, model = 'gpt-4o-mini', baseUrl, defaultHeaders = {} }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.defaultHeaders = defaultHeaders;
  }

  async generatePlan({ sourceSchema, targetSchema, sampleRecords = [], supportedTransformations = [] }) {
    if (!this.apiKey) {
      throw new Error('LLM_API_KEY is not configured for OpenAI/OpenRouter provider.');
    }

    const systemPrompt = `You are an expert data migration agent. Analyze the provided source schema, target schema, sample source records, and supported transformations.
Propose field mappings, identify risks, draft clarification questions, and outline the migration plan.
You MUST return ONLY a valid JSON object matching this structure (no markdown, no preamble):
{
  "mappings": [
    {
      "sourceField": "string",
      "targetField": "string",
      "transformation": "DIRECT",
      "confidence": 0.95,
      "reason": "explanation",
      "transformationConfig": {}
    }
  ],
  "unmappedSourceFields": [],
  "unmappedTargetFields": [],
  "risks": [
    {
      "level": "LOW",
      "field": "optional_field",
      "description": "risk description",
      "mitigation": "recommended action"
    }
  ],
  "clarificationQuestions": [
    {
      "id": "q_1",
      "question": "question text",
      "category": "SCHEMA_COMPATIBILITY",
      "resolved": false
    }
  ],
  "migrationPlan": {
    "steps": [
      {
        "order": 1,
        "title": "step title",
        "description": "step description"
      }
    ]
  }
}`;

    const userPrompt = `Source Schema:
${JSON.stringify(sourceSchema, null, 2)}

Target Schema:
${JSON.stringify(targetSchema, null, 2)}

Sample Records (First 5 records):
${JSON.stringify(sampleRecords.slice(0, 5), null, 2)}

Supported Transformations:
${JSON.stringify(supportedTransformations, null, 2)}

Produce the complete JSON migration analysis now:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...this.defaultHeaders,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('LLM request timed out after 25 seconds');
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ event: 'OPENAI_API_ERROR', status: response.status, error: errText }, 'OpenAI/OpenRouter API call failed');
      throw new Error(`API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM API returned empty response content.');
    }

    // Robust JSON extraction (strip code fences or extract between outermost curly braces)
    const cleanJson = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleanJson.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleanJson);
  }
}
