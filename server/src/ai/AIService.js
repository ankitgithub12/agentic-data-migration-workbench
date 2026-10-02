import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { aiAnalysisOutputSchema } from '../validators/schemas.js';
import { SUPPORTED_TRANSFORMATIONS } from '../migration/transformations.js';
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

    const prov = provider.toLowerCase();
    if (prov === 'openrouter') {
      logger.info({ event: 'AI_PROVIDER_INIT', provider: 'openrouter', model: model || 'openrouter/free' }, 'OpenRouter provider initialized');
      return new OpenAIProvider({
        apiKey,
        model: model || 'openrouter/free',
        baseUrl: baseUrl || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:5174',
          'X-Title': 'Agentic Migration Workbench',
        },
      });
    }

    if (prov === 'openai') {
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

    // Intelligent normalization to support diverse open-source & free models (OpenRouter, etc.)
    const normalized = this.normalizeRawOutput(rawOutput);

    // Strict validation using Zod
    let validationResult = aiAnalysisOutputSchema.safeParse(normalized);

    if (!validationResult.success && providerName !== 'MockProvider') {
      logger.warn(
        {
          event: 'AI_OUTPUT_VALIDATION_FALLBACK',
          provider: providerName,
          errors: validationResult.error.format(),
        },
        'Primary AI output failed strict schema validation. Falling back to deterministic MockProvider...'
      );
      const fallbackOutput = await this.mockProvider.generatePlan({
        sourceSchema,
        targetSchema,
        sampleRecords: sampleRecords.slice(0, 5),
        supportedTransformations,
      });
      providerName = 'MockProvider';
      validationResult = aiAnalysisOutputSchema.safeParse(fallbackOutput);
    }

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

  normalizeRawOutput(raw) {
    if (!raw || typeof raw !== 'object') return raw;

    // 1. Normalize mappings key & fields
    const rawMappings = raw.mappings || raw.fieldMappings || raw.fields || [];
    const mappings = Array.isArray(rawMappings)
      ? rawMappings.map((m) => {
          let transformation = m.transformation;
          if (!transformation && Array.isArray(m.transformations) && m.transformations.length > 0) {
            transformation = m.transformations[0];
          }
          let trans = String(transformation || 'DIRECT').trim().toUpperCase();
          if (trans === 'TRIM') trans = 'STRING_TRIM';
          if (trans === 'DATE') trans = 'DATE_ISO';
          if (trans === 'ISO_DATE') trans = 'DATE_ISO';
          if (trans === 'TO_NUMBER') trans = 'STRING_TO_NUMBER';
          if (trans === 'TO_STRING') trans = 'NUMBER_TO_STRING';
          if (!SUPPORTED_TRANSFORMATIONS.includes(trans)) {
            trans = 'DIRECT';
          }
          return {
            sourceField: m.sourceField || m.source || '',
            targetField: m.targetField || m.target || '',
            transformation: trans,
            confidence: typeof m.confidence === 'number' ? m.confidence : 0.88,
            reason: m.reason || m.description || 'AI suggested mapping',
            transformationConfig: m.transformationConfig || {},
          };
        })
      : [];

    // 2. Normalize risks
    const rawRisks = raw.risks || [];
    const risks = Array.isArray(rawRisks)
      ? rawRisks.map((r, i) => {
          if (typeof r === 'string') {
            return {
              level: 'LOW',
              field: '',
              description: r,
              mitigation: 'Verify field mapping and format constraints',
            };
          }
          return {
            level: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(r.level).toUpperCase())
              ? String(r.level).toUpperCase()
              : 'LOW',
            field: r.field || '',
            description: r.description || r.risk || `Risk #${i + 1}`,
            mitigation: r.mitigation || '',
          };
        })
      : [];

    // 3. Normalize clarification questions
    const rawQuestions = raw.clarificationQuestions || raw.questions || [];
    const clarificationQuestions = Array.isArray(rawQuestions)
      ? rawQuestions.map((q, i) => {
          if (typeof q === 'string') {
            return {
              id: `q_${i + 1}`,
              question: q,
              category: 'SCHEMA_COMPATIBILITY',
              resolved: false,
            };
          }
          return {
            id: q.id || `q_${i + 1}`,
            question: q.question || String(q),
            category: q.category || 'SCHEMA_COMPATIBILITY',
            resolved: Boolean(q.resolved),
          };
        })
      : [];

    // 4. Normalize migrationPlan
    let steps = [];
    if (raw.migrationPlan?.steps && Array.isArray(raw.migrationPlan.steps)) {
      steps = raw.migrationPlan.steps;
    } else if (Array.isArray(raw.migrationPlan)) {
      steps = raw.migrationPlan.map((s, i) => ({
        order: i + 1,
        title: typeof s === 'string' ? s.slice(0, 60) : `Step ${i + 1}`,
        description: typeof s === 'string' ? s : s.description || '',
      }));
    } else if (Array.isArray(raw.steps)) {
      steps = raw.steps.map((s, i) => ({
        order: s.order || i + 1,
        title: s.title || `Step ${i + 1}`,
        description: s.description || '',
      }));
    }

    return {
      mappings,
      unmappedSourceFields: Array.isArray(raw.unmappedSourceFields) ? raw.unmappedSourceFields : [],
      unmappedTargetFields: Array.isArray(raw.unmappedTargetFields) ? raw.unmappedTargetFields : [],
      risks,
      clarificationQuestions,
      migrationPlan: { steps },
    };
  }
}

export const aiService = new AIService();
