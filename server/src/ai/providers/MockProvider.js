import { LLMProvider } from './LLMProvider.js';

/**
 * High-fidelity deterministic heuristic AI provider
 * Employs semantic token matching and schema analysis to propose mappings,
 * calculate confidence, identify compatibility risks, and draft clarification questions.
 * Serves as an immediate zero-key offline provider and robust fallback.
 */
export class MockProvider extends LLMProvider {
  async generatePlan({ sourceSchema, targetSchema, sampleRecords = [], supportedTransformations = [] }) {
    const sourceFields = Object.keys(sourceSchema?.fields || {});
    const targetFields = Object.keys(targetSchema?.fields || {});

    const mappings = [];
    const unmappedSourceFields = [];
    const unmappedTargetFields = [...targetFields];
    const risks = [];
    const clarificationQuestions = [];

    // Helper to normalize strings for comparison (remove underscores, hyphens, lower-case)
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const sField of sourceFields) {
      const sNorm = normalize(sField);
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const tField of targetFields) {
        const tNorm = normalize(tField);

        // Exact match
        if (sField === tField) {
          bestMatch = tField;
          highestSimilarity = 1.0;
          break;
        }

        // Normalized match (e.g., customer_id vs customerId, full_name vs name)
        if (sNorm === tNorm) {
          bestMatch = tField;
          highestSimilarity = 0.96;
          break;
        }

        // Common abbreviations / sub-tokens
        if (sNorm.includes(tNorm) || tNorm.includes(sNorm)) {
          const score = 0.85;
          if (score > highestSimilarity) {
            highestSimilarity = score;
            bestMatch = tField;
          }
        } else if (
          (sNorm.includes('email') && tNorm.includes('email')) ||
          (sNorm.includes('phone') && tNorm.includes('phone')) ||
          (sNorm.includes('creat') && tNorm.includes('creat')) ||
          (sNorm.includes('name') && tNorm.includes('name'))
        ) {
          const score = 0.90;
          if (score > highestSimilarity) {
            highestSimilarity = score;
            bestMatch = tField;
          }
        }
      }

      if (bestMatch && highestSimilarity >= 0.7) {
        const sDef = sourceSchema.fields[sField] || {};
        const tDef = targetSchema.fields[bestMatch] || {};

        // Determine recommended transformation
        let transformation = 'DIRECT';
        let reason = `Mapped "${sField}" to "${bestMatch}" based on semantic similarity.`;

        if (tDef.type === 'string' && sDef.type === 'string') {
          if (bestMatch.toLowerCase().includes('email')) {
            transformation = 'LOWERCASE';
            reason = `Normalized email address to lowercase and trimmed whitespace.`;
          } else {
            transformation = 'STRING_TRIM';
            reason = `Trimmed leading and trailing whitespace from string values.`;
          }
        } else if (tDef.type === 'number' && sDef.type === 'string') {
          transformation = 'STRING_TO_NUMBER';
          reason = `Converted source string to numeric representation required by target.`;
        } else if (tDef.type === 'date' || bestMatch.toLowerCase().includes('at') || bestMatch.toLowerCase().includes('date')) {
          transformation = 'DATE_TO_ISO';
          reason = `Normalized legacy date representation to standardized ISO-8601 date.`;
        }

        mappings.push({
          sourceField: sField,
          targetField: bestMatch,
          transformation,
          confidence: highestSimilarity,
          reason,
          transformationConfig: {},
        });

        const targetIdx = unmappedTargetFields.indexOf(bestMatch);
        if (targetIdx > -1) {
          unmappedTargetFields.splice(targetIdx, 1);
        }
      } else {
        unmappedSourceFields.push(sField);
      }
    }

    // Identify risks based on unmapped target required fields
    for (const tField of unmappedTargetFields) {
      const tDef = targetSchema.fields[tField] || {};
      if (tDef.required) {
        risks.push({
          level: 'HIGH',
          field: tField,
          description: `Required target field "${tField}" has no matching source field mapped.`,
          mitigation: `Define a default transformation rule (e.g., NULL_TO_DEFAULT) or specify manual mapping.`,
        });
        clarificationQuestions.push({
          id: `cq_${tField}`,
          question: `Target field "${tField}" is required. What default value or source fallback should be populated?`,
          category: 'REQUIRED_FIELD_COMPATIBILITY',
          resolved: false,
          answer: '',
        });
      }
    }

    // Inspect sample records for potential data quality risks
    let foundEmailIssues = false;
    let foundDateIssues = false;
    for (const rec of sampleRecords) {
      for (const [key, val] of Object.entries(rec)) {
        if (key.toLowerCase().includes('email') && typeof val === 'string' && !val.includes('@')) {
          foundEmailIssues = true;
        }
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('created')) {
          if (val && isNaN(new Date(val).getTime())) {
            foundDateIssues = true;
          }
        }
      }
    }

    if (foundEmailIssues) {
      risks.push({
        level: 'MEDIUM',
        field: 'email_address',
        description: 'Sample data contains malformed email addresses that will fail RFC format validation.',
        mitigation: 'Invalid records will be isolated into Quarantine for remediation.',
      });
    }

    if (foundDateIssues) {
      risks.push({
        level: 'MEDIUM',
        field: 'created',
        description: 'Sample records contain unparseable date formats.',
        mitigation: 'Apply DATE_TO_ISO transformation and quarantine records with invalid dates.',
      });
    }

    // General risk regarding idempotency
    risks.push({
      level: 'LOW',
      field: 'customerId',
      description: 'Potential duplicate customerId values in source records during repeated runs.',
      mitigation: 'Deterministic idempotency key ensures existing customer records are skipped without duplication.',
    });

    const steps = [
      {
        order: 1,
        title: 'Source Schema & Sample Record Extraction',
        description: `Read ${sampleRecords.length} sample records from source collection.`,
      },
      {
        order: 2,
        title: 'Deterministic Field Transformation',
        description: `Apply ${mappings.length} approved field transformations.`,
      },
      {
        order: 3,
        title: 'Schema Validation & Quarantine Segregation',
        description: 'Validate transformed records against target schema; isolate invalid records into Quarantine.',
      },
      {
        order: 4,
        title: 'Idempotent Target Ingestion',
        description: 'Insert valid records into target store; skip existing records using idempotency keys.',
      },
      {
        order: 5,
        title: 'Deterministic Reconciliation',
        description: 'Verify sourceCount === acceptedCount + rejectedCount and targetInsertedCount === acceptedCount - duplicateCount.',
      },
    ];

    return {
      mappings,
      unmappedSourceFields,
      unmappedTargetFields,
      risks,
      clarificationQuestions,
      migrationPlan: { steps },
    };
  }
}
