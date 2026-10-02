import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { aiAnalysisOutputSchema } from '../validators/schemas.js';
import { GeminiProvider } from './providers/GeminiProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { MockProvider } from './providers/MockProvider.js';

export class AIService {
  constructor() {
    this.mockProvider = new MockProvider();
    this.primaryProvider = this.initPrimaryProvider();
  }

  initPrimaryProvider() {
    const { provider, apiKey, model, baseUrl } = config.llm;
    if (!apiKey) {
      logger.info({ event: 'AI_PROVIDER_DEFAULT' }, 'No LLM_API_KEY provided. Using high-fidelity MockProvider for deterministic AI analysis.');
      return this.mockProvider;
    }

    if (provider.toLowerCase() === 'openai') {
      logger.info({ event: 'AI_PROVIDER_INIT', provider: 'openai', model }, 'OpenAI provider initialized');
      return new OpenAIProvider({ apiKey, model, baseUrl });
    }

    // Default to Gemini
    logger.info({ event: 'AI_PROVIDER_INIT', provider: 'gemini', model }, 'Gemini provider initialized');
    return new GeminiProvider({ apiKey, model, baseUrl });
  }

  /**
   * Generates a structured migration plan and rigorously validates the output schema.
   */
  async generateMigrationPlan({
    sourceSchema,
    targetSchema,
    sampleRecords = [],
    supportedTransformations = [],
    projectId = null,
  }) {
    logger.info({ event: 'AI_ANALYSIS_STARTED', projectId }, 'AI analysis started...');

    let rawOutput;
    let providerName = this.primaryProvider.constructor.name;

    try {
      rawOutput = await this.primaryProvider.generatePlan({
        sourceSchema,
        targetSchema,
        sampleRecords: sampleRecords.slice(0, 5), // Cap sample records passed to LLM to prevent blowout
        supportedTransformations,
      });
    } catch (llmErr) {
      logger.warn(
        { event: 'AI_PRIMARY_FAILED', provider: providerName, error: llmErr.message },
        'Primary LLM provider failed. Falling back to deterministic MockProvider...'
      );
      try {
        rawOutput = await this.mockProvider.generatePlan({
          sourceSchema,
          targetSchema,
          sampleRecords: sampleRecords.slice(0, 5),
          supportedTransformations,
        });
        providerName = 'MockProvider';
      } catch (mockErr) {
        logger.error({ event: 'AI_ANALYSIS_FAILED', error: mockErr.message }, 'AI analysis completely failed');
        throw new Error(`AI Analysis failed: ${mockErr.message}`);
      }
    }

    // Strict validation using Zod
    const validationResult = aiAnalysisOutputSchema.safeParse(rawOutput);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.format();
      logger.error(
        {
          event: 'AI_OUTPUT_VALIDATION_FAILED',
          errors: formattedErrors,
          rawOutput,
        },
        'AI output failed schema validation.'
      );
      throw new Error(
        `AI generated an invalid response schema: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    logger.info(
      {
        event: 'AI_ANALYSIS_COMPLETED',
        projectId,
        mappingsCount: validationResult.data.mappings.length,
        risksCount: validationResult.data.risks.length,
        provider: providerName,
      },
      'AI analysis completed and validated successfully.'
    );

    return {
      ...validationResult.data,
      metadata: {
        provider: providerName,
        analyzedAt: new Date().toISOString(),
        advisoryNote: 'AI-generated suggestion — verify before approval.',
      },
    };
  }
}

export const aiService = new AIService();
