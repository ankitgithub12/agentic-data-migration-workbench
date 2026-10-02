import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB, disconnectDB } from '../config/db.js';
import { MigrationProject } from '../models/MigrationProject.js';
import { MigrationPlan } from '../models/MigrationPlan.js';
import { planService } from '../services/planService.js';
import { migrationService } from '../services/migrationService.js';

describe('Human Review & Plan Approval Workflow', () => {
  let project;
  let draftPlan;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await MigrationPlan.deleteMany({});
    await MigrationProject.deleteMany({});

    project = await MigrationProject.create({
      name: 'Approval Flow Project',
      sourceSchema: {
        fields: {
          customer_id: { type: 'number', required: true },
          full_name: { type: 'string', required: true },
        },
      },
      targetSchema: {
        fields: {
          customerId: { type: 'number', required: true },
          name: { type: 'string', required: true },
        },
      },
      sampleRecords: [{ customer_id: 101, full_name: 'Rahul Sharma' }],
      supportedTransformations: ['DIRECT', 'STRING_TRIM'],
    });

    draftPlan = await MigrationPlan.create({
      projectId: project._id,
      version: 1,
      status: 'PENDING_REVIEW',
      mappings: [
        { sourceField: 'customer_id', targetField: 'customerId', transformation: 'DIRECT', confidence: 1.0 },
        { sourceField: 'full_name', targetField: 'name', transformation: 'STRING_TRIM', confidence: 0.9 },
      ],
    });
  });

  it('rejects execution of a plan in PENDING_REVIEW or DRAFT status', async () => {
    await expect(migrationService.executeMigration(draftPlan._id)).rejects.toThrow(
      /Execution blocked: Migration plan is in status "PENDING_REVIEW"/
    );
  });

  it('rejects execution of a REJECTED plan', async () => {
    await planService.rejectPlan(draftPlan._id, {
      rejectedBy: 'DATA_OFFICER',
      reason: 'Schema mapping for name needs revision.',
    });

    await expect(migrationService.executeMigration(draftPlan._id)).rejects.toThrow(
      /Execution blocked: Migration plan is in status "REJECTED"/
    );
  });

  it('allows execution once plan is explicitly APPROVED by human operator', async () => {
    const approved = await planService.approvePlan(draftPlan._id, {
      approvedBy: 'LEAD_ENGINEER',
    });
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('LEAD_ENGINEER');

    const result = await migrationService.executeMigration(draftPlan._id, 'LEAD_ENGINEER');
    expect(result.run.status).toBe('COMPLETED');
  });

  it('creates a new version and reverts status to PENDING_REVIEW when an approved plan is edited', async () => {
    // Approve v1
    await planService.approvePlan(draftPlan._id, { approvedBy: 'LEAD_ENGINEER' });

    // User edits mappings
    const newVersionPlan = await planService.editPlan(draftPlan._id, {
      mappings: [
        { sourceField: 'customer_id', targetField: 'customerId', transformation: 'DIRECT', confidence: 1.0 },
        { sourceField: 'full_name', targetField: 'name', transformation: 'DIRECT', confidence: 0.9 },
      ],
      changeNotes: 'Changed name transformation to DIRECT',
    });

    // Check versioning
    expect(newVersionPlan.version).toBe(2);
    expect(newVersionPlan.status).toBe('PENDING_REVIEW'); // Reverted from APPROVED!

    // Historical v1 plan still exists intact as APPROVED
    const oldPlan = await MigrationPlan.findById(draftPlan._id);
    expect(oldPlan.version).toBe(1);
    expect(oldPlan.status).toBe('APPROVED');

    // New version cannot be executed until approved
    await expect(migrationService.executeMigration(newVersionPlan._id)).rejects.toThrow(
      /Execution blocked/
    );
  });
});
