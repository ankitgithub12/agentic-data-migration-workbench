import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { MigrationProject } from '../models/MigrationProject.js';
import { MigrationPlan } from '../models/MigrationPlan.js';
import { MigrationRun } from '../models/MigrationRun.js';
import { TargetCustomer } from '../models/TargetCustomer.js';
import { QuarantinedRecord } from '../models/QuarantinedRecord.js';
import { MigrationEngine } from '../migration/engine.js';
import { reconcileMigrationRun } from '../migration/reconciler.js';

describe('Migration Execution & Idempotency Engine', () => {
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
    await QuarantinedRecord.deleteMany({});
    await MigrationRun.deleteMany({});
    await MigrationPlan.deleteMany({});
    await MigrationProject.deleteMany({});

    project = await MigrationProject.create({
      name: 'Test Project',
      sourceSchema: {
        fields: {
          customer_id: { type: 'number', required: true },
          full_name: { type: 'string', required: true },
          email_address: { type: 'string', required: true, format: 'email' },
          phone: { type: 'string', required: false },
          created: { type: 'string', required: true },
        },
      },
      targetSchema: {
        fields: {
          customerId: { type: 'number', required: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true, format: 'email' },
          phoneNumber: { type: 'string', required: false },
          createdAt: { type: 'date', required: true },
        },
      },
      sampleRecords: [
        // Valid record
        {
          customer_id: 201,
          full_name: '  Rahul Sharma  ',
          email_address: 'RAHUL@GMAIL.COM',
          phone: '9876543210',
          created: '2026-09-20',
        },
        // Another valid record
        {
          customer_id: 202,
          full_name: 'Priya Patel',
          email_address: 'priya@gmail.com',
          phone: '9876543211',
          created: '2026-09-21',
        },
        // Invalid record (bad email)
        {
          customer_id: 203,
          full_name: 'Invalid Email Person',
          email_address: 'invalid-email-string',
          phone: '9876543212',
          created: '2026-09-22',
        },
      ],
      supportedTransformations: ['STRING_TRIM', 'LOWERCASE', 'DATE_TO_ISO', 'DIRECT'],
    });

    approvedPlan = await MigrationPlan.create({
      projectId: project._id,
      version: 1,
      status: 'APPROVED',
      approvedBy: 'LEAD_ARCHITECT',
      approvedAt: new Date(),
      mappings: [
        { sourceField: 'customer_id', targetField: 'customerId', transformation: 'DIRECT', confidence: 1.0 },
        { sourceField: 'full_name', targetField: 'name', transformation: 'STRING_TRIM', confidence: 0.95 },
        { sourceField: 'email_address', targetField: 'email', transformation: 'LOWERCASE', confidence: 0.95 },
        { sourceField: 'phone', targetField: 'phoneNumber', transformation: 'DIRECT', confidence: 0.9 },
        { sourceField: 'created', targetField: 'createdAt', transformation: 'DATE_TO_ISO', confidence: 0.9 },
      ],
    });
  });

  it('runs deterministic dry run without modifying target database', async () => {
    const result = await MigrationEngine.runDryRun({ project, plan: approvedPlan });

    expect(result.summary.sourceCount).toBe(3);
    expect(result.summary.acceptedCount).toBe(2);
    expect(result.summary.rejectedCount).toBe(1);
    expect(result.summary.duplicateCount).toBe(0);

    // Target database must remain untouched
    const targetCount = await TargetCustomer.countDocuments();
    expect(targetCount).toBe(0);

    // Quarantined record stored for the rejected item
    const quarantinedCount = await QuarantinedRecord.countDocuments({ migrationRunId: result.run._id });
    expect(quarantinedCount).toBe(1);
  });

  it('executes approved migration, isolates invalid record, and inserts valid records', async () => {
    const result = await MigrationEngine.executeMigration({ project, plan: approvedPlan });

    expect(result.metrics.sourceCount).toBe(3);
    expect(result.metrics.acceptedCount).toBe(2);
    expect(result.metrics.rejectedCount).toBe(1);
    expect(result.metrics.targetInsertedCount).toBe(2);
    expect(result.reconciliation.passed).toBe(true);

    // Verify TargetCustomer collection contents
    const inserted = await TargetCustomer.find({}).sort({ customerId: 1 });
    expect(inserted).toHaveLength(2);
    expect(inserted[0].customerId).toBe(201);
    expect(inserted[0].name).toBe('Rahul Sharma'); // Verified STRING_TRIM
    expect(inserted[0].email).toBe('rahul@gmail.com'); // Verified LOWERCASE
    expect(inserted[1].customerId).toBe(202);
  });

  it('demonstrates idempotent retry migration: prevents duplicate target records', async () => {
    // 1st run
    const firstRun = await MigrationEngine.executeMigration({ project, plan: approvedPlan });
    expect(firstRun.metrics.targetInsertedCount).toBe(2);

    // Reset plan status to APPROVED for retry demonstration
    approvedPlan.status = 'APPROVED';
    await approvedPlan.save();

    // 2nd run (retry on same source data)
    const retryRun = await MigrationEngine.executeMigration({ project, plan: approvedPlan });

    expect(retryRun.metrics.acceptedCount).toBe(2);
    expect(retryRun.metrics.duplicateCount).toBe(2);
    expect(retryRun.metrics.targetInsertedCount).toBe(0); // 0 new records inserted!
    expect(retryRun.reconciliation.passed).toBe(true);

    // Target count remains exactly 2
    const totalInTarget = await TargetCustomer.countDocuments();
    expect(totalInTarget).toBe(2);
  });

  it('detects reconciliation discrepancies accurately', () => {
    // Intentionally create an inconsistent count state
    const failedReconcile = reconcileMigrationRun({
      sourceCount: 100,
      transformedCount: 100,
      acceptedCount: 95,
      rejectedCount: 5,
      duplicateCount: 0,
      targetInsertedCount: 90, // Mismatch: expected 95 inserts
      isDryRun: false,
    });

    expect(failedReconcile.passed).toBe(false);
    expect(failedReconcile.status).toBe('FAILED');
    expect(failedReconcile.issues.length).toBeGreaterThan(0);
    expect(failedReconcile.issues[0]).toContain('Target insert discrepancy');
  });
});
