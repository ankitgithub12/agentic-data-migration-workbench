import { executeTransformation, TransformationError } from './transformations.js';
import { validateRecordAgainstSchema } from './validator.js';
import { reconcileMigrationRun } from './reconciler.js';
import { TargetCustomer } from '../models/TargetCustomer.js';
import { QuarantinedRecord } from '../models/QuarantinedRecord.js';
import { MigrationRun } from '../models/MigrationRun.js';
import { MigrationPlan } from '../models/MigrationPlan.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

/**
 * Core Migration Engine
 * Orchestrates deterministic transformation, validation, idempotency, dry runs, execution, and rollback.
 */
export class MigrationEngine {
  /**
   * Helper to derive a deterministic record identifier from source record
   */
  static getSourceRecordId(sourceRecord, index) {
    if (sourceRecord.customer_id !== undefined && sourceRecord.customer_id !== null && sourceRecord.customer_id !== '') {
      return sourceRecord.customer_id;
    }
    if (sourceRecord.id !== undefined && sourceRecord.id !== null && sourceRecord.id !== '') {
      return sourceRecord.id;
    }
    if (sourceRecord._id !== undefined && sourceRecord._id !== null) {
      return sourceRecord._id;
    }
    return `rec_${index + 1}`;
  }

  /**
   * Apply approved mappings and transformations to a single source record
   */
  static transformRecord(sourceRecord, mappings) {
    const transformed = {};
    const transformationErrors = [];

    for (const mapping of mappings) {
      const { sourceField, targetField, transformation, transformationConfig } = mapping;
      const rawValue = sourceRecord[sourceField];

      try {
        const transformedValue = executeTransformation(transformation, rawValue, transformationConfig);
        transformed[targetField] = transformedValue;
      } catch (err) {
        transformationErrors.push({
          field: targetField,
          sourceField,
          value: rawValue,
          error: err.message || 'Transformation failed',
          rule: `TRANSFORMATION_${transformation}`,
        });
      }
    }

    return { transformed, transformationErrors };
  }

  /**
   * Run a Deterministic Dry Run
   * Does NOT persist target records, but checks transformations, validations, and duplicate checks.
   */
  static async runDryRun({ project, plan, user = 'HUMAN_OPERATOR' }) {
    logger.info({ event: 'DRY_RUN_STARTED', projectId: project._id, planId: plan._id }, 'Starting dry run...');

    const run = new MigrationRun({
      projectId: project._id,
      planId: plan._id,
      planVersion: plan.version,
      type: 'DRY_RUN',
      status: 'RUNNING',
      sourceCount: project.sampleRecords.length,
      startedAt: new Date(),
    });
    await run.save();

    await AuditLog.create({
      event: 'DRY_RUN_STARTED',
      projectId: project._id,
      planId: plan._id,
      runId: run._id,
      actor: user,
      metadata: { totalRecords: project.sampleRecords.length },
    });

    const sampleRecords = project.sampleRecords || [];
    let transformedCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;
    const quarantinedItems = [];
    const sampleAccepted = [];

    // Pre-fetch existing customer IDs from TargetCustomer for duplicate detection
    const existingTargetCustomers = await TargetCustomer.find({}, { customerId: 1 }).lean();
    const existingIdSet = new Set(existingTargetCustomers.map((c) => String(c.customerId)));
    const seenInBatchSet = new Set();

    for (let i = 0; i < sampleRecords.length; i++) {
      const sourceRecord = sampleRecords[i];
      const sourceRecordId = this.getSourceRecordId(sourceRecord, i);

      // 1. Transform record
      const { transformed, transformationErrors } = this.transformRecord(sourceRecord, plan.mappings);
      transformedCount++;

      // 2. Validate against target schema
      const validationResult = validateRecordAgainstSchema(transformed, project.targetSchema);

      // Combine transformation errors and validation errors
      const allFieldErrors = [...transformationErrors, ...validationResult.fieldErrors];
      const allErrors = [
        ...transformationErrors.map((e) => e.error),
        ...validationResult.errors,
      ];

      // 3. Duplicate detection
      const targetId = transformed.customerId !== undefined ? String(transformed.customerId) : String(sourceRecordId);
      let isDuplicate = false;
      if (existingIdSet.has(targetId) || seenInBatchSet.has(targetId)) {
        isDuplicate = true;
        duplicateCount++;
      } else {
        seenInBatchSet.add(targetId);
      }

      if (allFieldErrors.length > 0) {
        rejectedCount++;
        quarantinedItems.push({
          migrationRunId: run._id,
          projectId: project._id,
          sourceRecordId,
          sourceRecord,
          errors: allErrors,
          fieldErrors: allFieldErrors,
        });
      } else {
        acceptedCount++;
        if (sampleAccepted.length < 10) {
          sampleAccepted.push({
            sourceRecordId,
            sourceRecord,
            transformedRecord: transformed,
            isDuplicate,
          });
        }
      }
    }

    // Save quarantined records for inspection
    if (quarantinedItems.length > 0) {
      await QuarantinedRecord.insertMany(quarantinedItems);
    }

    const reconciliation = reconcileMigrationRun({
      sourceCount: sampleRecords.length,
      transformedCount,
      acceptedCount,
      rejectedCount,
      duplicateCount,
      targetInsertedCount: 0, // Dry run does not write
      isDryRun: true,
    });

    run.status = 'COMPLETED';
    run.transformedCount = transformedCount;
    run.acceptedCount = acceptedCount;
    run.rejectedCount = rejectedCount;
    run.duplicateCount = duplicateCount;
    run.targetInsertedCount = 0;
    run.reconciliationStatus = reconciliation.status;
    run.reconciliationDetails = reconciliation;
    run.completedAt = new Date();
    await run.save();

    await AuditLog.create({
      event: 'DRY_RUN_COMPLETED',
      projectId: project._id,
      planId: plan._id,
      runId: run._id,
      actor: user,
      metadata: {
        sourceCount: sampleRecords.length,
        acceptedCount,
        rejectedCount,
        duplicateCount,
        reconciliationStatus: reconciliation.status,
      },
    });

    logger.info(
      {
        event: 'DRY_RUN_COMPLETED',
        runId: run._id,
        accepted: acceptedCount,
        rejected: rejectedCount,
        duplicates: duplicateCount,
      },
      'Dry run finished successfully'
    );

    return {
      run,
      summary: {
        sourceCount: sampleRecords.length,
        transformedCount,
        acceptedCount,
        rejectedCount,
        duplicateCount,
      },
      sampleAccepted,
      reconciliation,
      quarantinedCount: quarantinedItems.length,
    };
  }

  /**
   * Execute an Approved Migration Plan
   * Strictly enforces human approval: DRAFT or REJECTED plans CANNOT be executed.
   */
  static async executeMigration({ project, plan, user = 'HUMAN_OPERATOR' }) {
    if (plan.status !== 'APPROVED') {
      throw new Error(`Execution blocked: Migration plan is in status "${plan.status}". Only APPROVED plans can be executed.`);
    }

    logger.info({ event: 'MIGRATION_STARTED', projectId: project._id, planId: plan._id }, 'Starting migration execution...');

    const run = new MigrationRun({
      projectId: project._id,
      planId: plan._id,
      planVersion: plan.version,
      type: 'EXECUTION',
      status: 'RUNNING',
      sourceCount: project.sampleRecords.length,
      startedAt: new Date(),
    });
    await run.save();

    await AuditLog.create({
      event: 'MIGRATION_STARTED',
      projectId: project._id,
      planId: plan._id,
      runId: run._id,
      actor: user,
      metadata: { planVersion: plan.version, totalRecords: project.sampleRecords.length },
    });

    const sampleRecords = project.sampleRecords || [];
    let transformedCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;
    let targetInsertedCount = 0;

    const quarantinedItems = [];
    const insertedTargetIds = [];
    const insertedRecords = [];

    // Pre-fetch existing customer IDs from TargetCustomer
    const existingTargetCustomers = await TargetCustomer.find({}, { customerId: 1, idempotencyKey: 1 }).lean();
    const existingIdSet = new Set(existingTargetCustomers.map((c) => String(c.customerId)));
    const existingKeySet = new Set(existingTargetCustomers.map((c) => c.idempotencyKey));
    const seenInBatchSet = new Set();

    for (let i = 0; i < sampleRecords.length; i++) {
      const sourceRecord = sampleRecords[i];
      const sourceRecordId = this.getSourceRecordId(sourceRecord, i);

      // 1. Transform record
      const { transformed, transformationErrors } = this.transformRecord(sourceRecord, plan.mappings);
      transformedCount++;

      // 2. Deterministic validation
      const validationResult = validateRecordAgainstSchema(transformed, project.targetSchema);
      const allFieldErrors = [...transformationErrors, ...validationResult.fieldErrors];
      const allErrors = [
        ...transformationErrors.map((e) => e.error),
        ...validationResult.errors,
      ];

      // Check if invalid
      if (allFieldErrors.length > 0) {
        rejectedCount++;
        quarantinedItems.push({
          migrationRunId: run._id,
          projectId: project._id,
          sourceRecordId,
          sourceRecord,
          errors: allErrors,
          fieldErrors: allFieldErrors,
        });
        continue;
      }

      acceptedCount++;

      // 3. Idempotency & Duplicate prevention
      const customerId = transformed.customerId !== undefined ? Number(transformed.customerId) : Number(sourceRecordId);
      const strId = String(customerId);
      const idempotencyKey = `cust_${customerId}`;

      // Check whether record already exists in target or was seen in this batch
      if (existingIdSet.has(strId) || existingKeySet.has(idempotencyKey) || seenInBatchSet.has(strId)) {
        duplicateCount++;
        continue;
      }

      seenInBatchSet.add(strId);
      existingIdSet.add(strId);
      existingKeySet.add(idempotencyKey);

      // 4. Construct target document
      const targetDoc = new TargetCustomer({
        customerId,
        name: transformed.name || '',
        email: transformed.email || '',
        phoneNumber: transformed.phoneNumber || '',
        createdAt: transformed.createdAt ? new Date(transformed.createdAt) : new Date(),
        migrationRunId: run._id,
        idempotencyKey,
        rawAttributes: transformed,
      });

      insertedRecords.push(targetDoc);
    }

    // Insert valid non-duplicate records
    if (insertedRecords.length > 0) {
      const savedDocs = await TargetCustomer.insertMany(insertedRecords, { ordered: false });
      targetInsertedCount = savedDocs.length;
      for (const doc of savedDocs) {
        insertedTargetIds.push(doc._id.toString());
      }
    }

    // Save quarantined records
    if (quarantinedItems.length > 0) {
      await QuarantinedRecord.insertMany(quarantinedItems);
    }

    // 5. Deterministic reconciliation
    const reconciliation = reconcileMigrationRun({
      sourceCount: sampleRecords.length,
      transformedCount,
      acceptedCount,
      rejectedCount,
      duplicateCount,
      targetInsertedCount,
      isDryRun: false,
    });

    run.status = reconciliation.passed ? 'COMPLETED' : 'FAILED';
    run.transformedCount = transformedCount;
    run.acceptedCount = acceptedCount;
    run.rejectedCount = rejectedCount;
    run.duplicateCount = duplicateCount;
    run.targetInsertedCount = targetInsertedCount;
    run.insertedTargetIds = insertedTargetIds;
    run.reconciliationStatus = reconciliation.status;
    run.reconciliationDetails = reconciliation;
    run.completedAt = new Date();
    await run.save();

    // Update plan status
    plan.status = 'EXECUTED';
    await plan.save();

    await AuditLog.create({
      event: reconciliation.passed ? 'MIGRATION_COMPLETED' : 'MIGRATION_FAILED',
      projectId: project._id,
      planId: plan._id,
      runId: run._id,
      actor: user,
      metadata: {
        sourceCount: sampleRecords.length,
        acceptedCount,
        rejectedCount,
        duplicateCount,
        targetInsertedCount,
        reconciliationStatus: reconciliation.status,
      },
    });

    logger.info(
      {
        event: 'MIGRATION_COMPLETED',
        runId: run._id,
        inserted: targetInsertedCount,
        duplicates: duplicateCount,
        reconciled: reconciliation.passed,
      },
      'Migration run execution finished'
    );

    return {
      run,
      reconciliation,
      metrics: {
        sourceCount: sampleRecords.length,
        transformedCount,
        acceptedCount,
        rejectedCount,
        duplicateCount,
        targetInsertedCount,
      },
    };
  }

  /**
   * Rollback a Migration Run
   * Safely deletes ONLY records created during this specific run.
   * Prevents unsafe repeated rollback.
   */
  static async rollbackMigration({ runId, user = 'HUMAN_OPERATOR' }) {
    const run = await MigrationRun.findById(runId);
    if (!run) {
      throw new Error(`Migration run with ID ${runId} not found.`);
    }

    if (run.type !== 'EXECUTION') {
      throw new Error(`Cannot rollback a ${run.type} run.`);
    }

    if (run.status === 'ROLLED_BACK') {
      throw new Error('Unsafe operation: This migration run has already been rolled back.');
    }

    if (run.status !== 'COMPLETED' && run.status !== 'FAILED') {
      throw new Error(`Cannot rollback run in status "${run.status}".`);
    }

    logger.info({ event: 'MIGRATION_ROLLBACK_STARTED', runId }, 'Rolling back migration run...');

    // Delete records created by this migration run
    const deleteResult = await TargetCustomer.deleteMany({
      _id: { $in: run.insertedTargetIds },
    });

    const deletedCount = deleteResult.deletedCount || 0;

    // Update run status
    run.status = 'ROLLED_BACK';
    run.rolledBackAt = new Date();
    await run.save();

    // Update plan status
    const plan = await MigrationPlan.findById(run.planId);
    if (plan && plan.status === 'EXECUTED') {
      plan.status = 'ROLLED_BACK';
      await plan.save();
    }

    await AuditLog.create({
      event: 'MIGRATION_ROLLED_BACK',
      projectId: run.projectId,
      planId: run.planId,
      runId: run._id,
      actor: user,
      metadata: {
        recordsRemoved: deletedCount,
        targetInsertedOriginally: run.targetInsertedCount,
      },
    });

    logger.info({ event: 'MIGRATION_ROLLED_BACK', runId, deletedCount }, 'Rollback completed successfully');

    return {
      success: true,
      runId: run._id,
      deletedCount,
      status: 'ROLLED_BACK',
      message: `Successfully rolled back ${deletedCount} records created by Migration Run #${run._id}.`,
    };
  }
}
