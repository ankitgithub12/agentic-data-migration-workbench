import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../ai/AIService.js';
import { LLMProvider } from '../ai/providers/LLMProvider.js';

describe('AI Agent Architecture & Schema Safety', () => {
  const dummySourceSchema = {
    fields: {
      legacy_name: { type: 'string', required: true },
      legacy_age: { type: 'string', required: false },
    },
  };
  const dummyTargetSchema = {
    fields: {
      name: { type: 'string', required: true },
      age: { type: 'number', required: false },
    },
  };

  it('successfully parses and validates valid AI JSON output', async () => {
    const aiService = new AIService();
    class MockValidProvider extends LLMProvider {
      async generatePlan() {
        return {
          mappings: [
            {
              sourceField: 'legacy_name',
              targetField: 'name',
              transformation: 'STRING_TRIM',
              confidence: 0.95,
              reason: 'Trim whitespace for clean display name',
            },
          ],
          unmappedSourceFields: [],
          unmappedTargetFields: ['age'],
          risks: [
            {
              level: 'LOW',
              field: 'age',
              description: 'Age field unmapped',
              mitigation: 'Leave optional',
            },
          ],
          clarificationQuestions: [
            {
              id: 'q1',
              question: 'Should age be mapped?',
              category: 'SCHEMA',
              resolved: false,
              answer: '',
            },
          ],
          migrationPlan: {
            steps: [{ order: 1, title: 'Step 1', description: 'Transform' }],
          },
        };
      }
    }

    aiService.primaryProvider = new MockValidProvider();

    const plan = await aiService.generateMigrationPlan({
      sourceSchema: dummySourceSchema,
      targetSchema: dummyTargetSchema,
      sampleRecords: [],
      supportedTransformations: ['STRING_TRIM', 'DIRECT'],
    });

    expect(plan.mappings).toHaveLength(1);
    expect(plan.mappings[0].transformation).toBe('STRING_TRIM');
    expect(plan.metadata.advisoryNote).toBe('AI-generated suggestion — verify before approval.');
  });

  it('rejects AI output suggesting unsupported transformations', async () => {
    const aiService = new AIService();
    class MockIllegalTransformProvider extends LLMProvider {
      async generatePlan() {
        return {
          mappings: [
            {
              sourceField: 'legacy_name',
              targetField: 'name',
              transformation: 'UNSUPPORTED_ARBITRARY_JS_EVAL',
              confidence: 0.99,
              reason: 'Run custom code',
            },
          ],
          unmappedSourceFields: [],
          unmappedTargetFields: [],
          risks: [],
          clarificationQuestions: [],
          migrationPlan: { steps: [] },
        };
      }
    }

    aiService.primaryProvider = new MockIllegalTransformProvider();

    await expect(
      aiService.generateMigrationPlan({
        sourceSchema: dummySourceSchema,
        targetSchema: dummyTargetSchema,
        sampleRecords: [],
        supportedTransformations: ['STRING_TRIM', 'DIRECT'],
      })
    ).rejects.toThrow(/Invalid transformation "UNSUPPORTED_ARBITRARY_JS_EVAL"/);
  });

  it('rejects malformed AI responses missing required structures', async () => {
    const aiService = new AIService();
    class MockMalformedProvider extends LLMProvider {
      async generatePlan() {
        return {
          thisIsTotallyMalformed: true,
        };
      }
    }

    aiService.primaryProvider = new MockMalformedProvider();

    await expect(
      aiService.generateMigrationPlan({
        sourceSchema: dummySourceSchema,
        targetSchema: dummyTargetSchema,
        sampleRecords: [],
        supportedTransformations: ['STRING_TRIM', 'DIRECT'],
      })
    ).rejects.toThrow(/AI generated an invalid response schema/);
  });

  it('gracefully falls back to MockProvider when primary LLM times out or errors', async () => {
    const aiService = new AIService();
    class MockThrowingProvider extends LLMProvider {
      async generatePlan() {
        throw new Error('LLM connection timeout after 30000ms');
      }
    }

    aiService.primaryProvider = new MockThrowingProvider();

    // AIService should log the primary error and fall back to the deterministic MockProvider
    const plan = await aiService.generateMigrationPlan({
      sourceSchema: dummySourceSchema,
      targetSchema: dummyTargetSchema,
      sampleRecords: [],
      supportedTransformations: ['STRING_TRIM', 'DIRECT'],
    });

    expect(plan.mappings.length).toBeGreaterThan(0);
    expect(plan.metadata.provider).toBe('MockProvider');
  });
});
