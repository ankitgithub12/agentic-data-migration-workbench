import { LLMProvider } from './LLMProvider.js';
import { logger } from '../../config/logger.js';

export class OpenAIProvider extends LLMProvider {
  constructor({ apiKey, model = 'gpt-4o-mini', baseUrl }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  async generatePlan({ sourceSchema, targetSchema, sampleRecords = [], supportedTransformations = [] }) {
    if (!this.apiKey) {
      throw new Error('LLM_API_KEY is not configured for OpenAI provider.');
    }

    const systemPrompt = `You are an expert data migration agent. Analyze the provided source schema, target schema, sample source records, and supported transformations.
Propose field mappings, identify risks, draft clarification questions, and outline the migration plan.
You MUST output valid JSON conforming strictly to the requested schema. You MUST only suggest transformations from the supported transformations list.`;

    const userPrompt = `
Source Schema:
${JSON.stringify(sourceSchema, null, 2)}

Target Schema:
${JSON.stringify(targetSchema, null, 2)}

Sample Records (First 5 records):
${JSON.stringify(sampleRecords.slice(0, 5), null, 2)}

Supported Transformations:
${JSON.stringify(supportedTransformations, null, 2)}
`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ event: 'OPENAI_API_ERROR', status: response.status, error: errText }, 'OpenAI API call failed');
      throw new Error(`OpenAI API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API returned empty response content.');
    }

    return JSON.parse(content);
  }
}
