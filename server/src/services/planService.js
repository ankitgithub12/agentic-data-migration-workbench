import { planRepository } from '../repositories/planRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { aiService } from '../ai/AIService.js';
import { updatePlanSchema, approvePlanSchema, rejectPlanSchema } from '../validators/schemas.js';
import { logger } from '../config/logger.js';

export class PlanService {
  /**
   * Request AI Analysis and generate a new versioned migration plan
   */
  async generatePlanWithAI(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    const aiResult = await aiService.generateMigrationPlan({
      sourceSchema: project.sourceSchema,
      targetSchema: project.targetSchema,
      sampleRecords: project.sampleRecords,
      supportedTransformations: project.supportedTransformations,
      projectId: project._id,
    });

    const currentLatestVersion = await planRepository.getLatestVersion(projectId);
    const newVersion = currentLatestVersion + 1;

    const plan = await planRepository.create({
      projectId: project._id,
      version: newVersion,
      mappings: aiResult.mappings,
      unmappedSourceFields: aiResult.unmappedSourceFields,
      unmappedTargetFields: aiResult.unmappedTargetFields,
      risks: aiResult.risks,
      clarificationQuestions: aiResult.clarificationQuestions,
      steps: aiResult.migrationPlan.steps,
      status: 'PENDING_REVIEW',
      createdBy: `AI_AGENT (${aiResult.metadata.provider})`,
      changeNotes: `AI-generated migration plan v${newVersion}`,
    });

    await auditRepository.log({
      event: 'PLAN_CREATED',
      projectId: project._id,
      planId: plan._id,
      actor: `AI_AGENT (${aiResult.metadata.provider})`,
      metadata: {
        version: newVersion,
        mappingsCount: plan.mappings.length,
        risksCount: plan.risks.length,
        status: plan.status,
      },
    });

    logger.info({ event: 'PLAN_GENERATED', planId: plan._id, version: newVersion }, 'Plan generated successfully');

    return {
      plan,
      aiMetadata: aiResult.metadata,
    };
  }

  /**
   * User edits a plan: creates a NEW version! Never silently overwrites.
   * If the previous plan was APPROVED, the new version reverts to DRAFT/PENDING_REVIEW.
   */
  async editPlan(planId, editPayload, user = 'HUMAN_OPERATOR') {
    const validated = updatePlanSchema.parse(editPayload);
    const existingPlan = await planRepository.findById(planId);
    if (!existingPlan) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }

    const currentLatestVersion = await planRepository.getLatestVersion(existingPlan.projectId);
    const newVersion = currentLatestVersion + 1;

    // Create a new version with the updated mappings and draft status
    const newPlan = await planRepository.create({
      projectId: existingPlan.projectId,
      version: newVersion,
      mappings: validated.mappings,
      unmappedSourceFields: existingPlan.unmappedSourceFields,
      unmappedTargetFields: existingPlan.unmappedTargetFields,
      risks: validated.risks || existingPlan.risks,
      clarificationQuestions: validated.clarificationQuestions || existingPlan.clarificationQuestions,
      steps: existingPlan.steps,
      status: 'PENDING_REVIEW', // Any edit resets approval status to PENDING_REVIEW
      createdBy: user,
      changeNotes: validated.changeNotes || `User modifications on top of v${existingPlan.version}`,
    });

    await auditRepository.log({
      event: 'PLAN_EDITED',
      projectId: existingPlan.projectId,
      planId: newPlan._id,
      actor: user,
      metadata: {
        parentVersion: existingPlan.version,
        newVersion,
        changeNotes: newPlan.changeNotes,
      },
    });

    return newPlan;
  }

  /**
   * Human Operator Approves the Plan
   */
  async approvePlan(planId, payload) {
    const validated = approvePlanSchema.parse(payload);
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }

    if (plan.status === 'APPROVED') {
      return plan; // Idempotent approval
    }

    if (plan.status === 'EXECUTED') {
      throw new Error('Plan has already been executed.');
    }

    plan.status = 'APPROVED';
    plan.approvedBy = validated.approvedBy;
    plan.approvedAt = new Date();
    await plan.save();

    await auditRepository.log({
      event: 'PLAN_APPROVED',
      projectId: plan.projectId,
      planId: plan._id,
      actor: validated.approvedBy,
      metadata: {
        version: plan.version,
        mappingsCount: plan.mappings.length,
      },
    });

    return plan;
  }

  /**
   * Human Operator Rejects the Plan
   */
  async rejectPlan(planId, payload) {
    const validated = rejectPlanSchema.parse(payload);
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }

    plan.status = 'REJECTED';
    plan.rejectedBy = validated.rejectedBy;
    plan.rejectedAt = new Date();
    plan.rejectionReason = validated.reason;
    await plan.save();

    await auditRepository.log({
      event: 'PLAN_REJECTED',
      projectId: plan.projectId,
      planId: plan._id,
      actor: validated.rejectedBy,
      metadata: {
        version: plan.version,
        reason: validated.reason,
      },
    });

    return plan;
  }

  async getPlanById(id) {
    const plan = await planRepository.findById(id);
    if (!plan) {
      throw new Error(`Plan with ID ${id} not found.`);
    }
    return plan;
  }

  async getPlansByProject(projectId) {
    return await planRepository.findByProject(projectId);
  }
}

export const planService = new PlanService();
