import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB, disconnectDB } from '../config/db.js';
import { MigrationProject } from '../models/MigrationProject.js';
import { MigrationPlan } from '../models/MigrationPlan.js';
import { TargetCustomer } from '../models/TargetCustomer.js';
import { MigrationEngine } from '../migration/engine.js';
import { migrationService } from '../services/migrationService.js';

describe('Selective Rollback Engine', () => {
  let project;
  let approvedPlan;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await TargetCustomer.deleteMany({});
    await MigrationPlan.deleteMany({});
    await MigrationProject.deleteMany({});

    // Pre-insert an unrelated customer record created earlier by another process
    await TargetCustomer.create({
      customerId: 999,
      name: 'Existing Customer',
      email: 'existing@corp.com',
      createdAt: new Date(),
      migrationRunId: new (await import('mongoose')).default.Types.ObjectId(),
      idempotencyKey: 'cust_999',
    });

    project = await MigrationProject.create({
      name: 'Rollback Test Project',
      sourceSchema: {
        fields: {
          customer_id: { type: 'number', required: true },
          full_name: { type: 'string', required: true },
          email_address: { type: 'string', required: true, format: 'email' },
          created: { type: 'string', required: true },
        },
      },
      targetSchema: {
        fields: {
          customerId: { type: 'number', required: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true, format: 'email' },
          createdAt: { type: 'date', required: true },
        },
      },
      sampleRecords: [
        { customer_id: 301, full_name: 'Rollback Person 1', email_address: 'p1@test.com', created: '2026-09-20' },
        { customer_id: 302, full_name: 'Rollback Person 2', email_address: 'p2@test.com', created: '2026-09-20' },
      ],
      supportedTransformations: ['DIRECT', 'DATE_TO_ISO', 'LOWERCASE'],
    });

    approvedPlan = await MigrationPlan.create({
      projectId: project._id,
      version: 1,
      status: 'APPROVED',
      mappings: [
        { sourceField: 'customer_id', targetField: 'customerId', transformation: 'DIRECT', confidence: 1.0 },
        { sourceField: 'full_name', targetField: 'name', transformation: 'DIRECT', confidence: 1.0 },
        { sourceField: 'email_address', targetField: 'email', transformation: 'LOWERCASE', confidence: 1.0 },
        { sourceField: 'created', targetField: 'createdAt', transformation: 'DATE_TO_ISO', confidence: 1.0 },
      ],
    });
  });

  it('rolls back ONLY records created by the specific migration run', async () => {
    // Execute migration
    const execResult = await MigrationEngine.executeMigration({ project, plan: approvedPlan });
    expect(execResult.metrics.targetInsertedCount).toBe(2);

    // Total in target should now be 3 (1 pre-existing + 2 from run)
    expect(await TargetCustomer.countDocuments()).toBe(3);

    // Perform rollback on this run
    const rollbackResult = await migrationService.rollback(execResult.run._id, 'TEST_ADMIN');
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.deletedCount).toBe(2);
    expect(rollbackResult.status).toBe('ROLLED_BACK');

    // Only pre-existing customer 999 must remain!
    const remaining = await TargetCustomer.find({});
    expect(remaining).toHaveLength(1);
    expect(remaining[0].customerId).toBe(999);
  });

  it('prevents unsafe repeated rollback on an already rolled-back run', async () => {
    const execResult = await MigrationEngine.executeMigration({ project, plan: approvedPlan });
    await migrationService.rollback(execResult.run._id, 'TEST_ADMIN');

    // Second rollback attempt must fail safely
    await expect(migrationService.rollback(execResult.run._id, 'TEST_ADMIN')).rejects.toThrow(
      /This migration run has already been rolled back/
    );
  });
});
