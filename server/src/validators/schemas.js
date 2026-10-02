import { z } from 'zod';
import { SUPPORTED_TRANSFORMATIONS } from '../migration/transformations.js';

/**
 * Zod validation schemas for AI output, projects, plans, and reviews
 */

// Schema for individual field mapping proposed by AI or edited by user
export const fieldMappingSchema = z.object({
  sourceField: z.string().min(1, 'sourceField is required'),
  targetField: z.string().min(1, 'targetField is required'),
  transformation: z.string().refine(
    (val) => SUPPORTED_TRANSFORMATIONS.includes(val.toUpperCase()),
    (val) => ({
      message: `Invalid transformation "${val}". Must be one of: ${SUPPORTED_TRANSFORMATIONS.join(', ')}`,
    })
  ),
  confidence: z.number().min(0).max(1),
  reason: z.string().default(''),
  transformationConfig: z.record(z.any()).optional().default({}),
});

// Schema for identified migration risk
export const migrationRiskSchema = z.object({
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  field: z.string().optional().default(''),
  description: z.string().min(1, 'description is required'),
  mitigation: z.string().optional().default(''),
});

// Schema for clarification questions
export const clarificationQuestionSchema = z.object({
  id: z.string().default(() => `q_${Math.random().toString(36).substring(2, 9)}`),
  question: z.string().min(1, 'question is required'),
  category: z.string().optional().default('SCHEMA_COMPATIBILITY'),
  resolved: z.boolean().optional().default(false),
  answer: z.string().optional().default(''),
});

// Schema for plan steps
export const migrationStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string().optional().default(''),
});

// AI Structured Output Schema
export const aiAnalysisOutputSchema = z.object({
  mappings: z.array(fieldMappingSchema),
  unmappedSourceFields: z.array(z.string()).default([]),
  unmappedTargetFields: z.array(z.string()).default([]),
  risks: z.array(migrationRiskSchema).default([]),
  clarificationQuestions: z.array(clarificationQuestionSchema).default([]),
  migrationPlan: z.object({
    steps: z.array(migrationStepSchema).default([]),
  }),
});

// Project Creation Schema
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional().default(''),
  sourceSchema: z.object({
    name: z.string().default('source_schema'),
    fields: z.record(
      z.object({
        type: z.string(),
        required: z.boolean().optional().default(false),
        description: z.string().optional(),
        format: z.string().optional(),
      })
    ),
  }),
  targetSchema: z.object({
    name: z.string().default('target_schema'),
    fields: z.record(
      z.object({
        type: z.string(),
        required: z.boolean().optional().default(false),
        description: z.string().optional(),
        format: z.string().optional(),
        enum: z.array(z.string()).optional(),
        min: z.number().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
      })
    ),
  }),
  sampleRecords: z.array(z.record(z.any())).max(1000, 'Maximum sample size is 1,000 records'),
  supportedTransformations: z.array(z.string()).optional(),
});

// Plan Modification Schema
export const updatePlanSchema = z.object({
  mappings: z.array(fieldMappingSchema),
  risks: z.array(migrationRiskSchema).optional(),
  clarificationQuestions: z.array(clarificationQuestionSchema).optional(),
  changeNotes: z.string().optional().default('Updated mappings during human review'),
});

// Plan Approval / Rejection Schema
export const approvePlanSchema = z.object({
  approvedBy: z.string().min(1, 'Approver name or ID is required'),
});

export const rejectPlanSchema = z.object({
  rejectedBy: z.string().min(1, 'Rejector name or ID is required'),
  reason: z.string().min(3, 'Rejection reason must be provided'),
});
