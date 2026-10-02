import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { MigrationProject } from '../models/MigrationProject.js';
import { MigrationPlan } from '../models/MigrationPlan.js';
import { TargetCustomer } from '../models/TargetCustomer.js';
import { QuarantinedRecord } from '../models/QuarantinedRecord.js';
import { MigrationRun } from '../models/MigrationRun.js';

describe('Workbench REST API Endpoints', () => {
  let project;
  let plan;

  beforeAll(async () => {
    await connectDB();
    await TargetCustomer.deleteMany({});
    await QuarantinedRecord.deleteMany({});
    await MigrationRun.deleteMany({});
    await MigrationPlan.deleteMany({});
    await MigrationProject.deleteMany({});

    project = await MigrationProject.create({
      name: 'API Test Project',
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
        { customer_id: 501, full_name: 'API User 1', email_address: 'u1@api.com', created: '2026-09-20' },
        { customer_id: 502, full_name: 'API User 2', email_address: 'bad-email', created: '2026-09-20' },
      ],
      supportedTransformations: ['DIRECT', 'STRING_TRIM', 'LOWERCASE', 'DATE_TO_ISO'],
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health returns database and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /api/projects returns list of projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/projects/:id/ai/analyze generates an AI plan', async () => {
    const res = await request(app).post(`/api/projects/${project._id}/ai/analyze`);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.status).toBe('PENDING_REVIEW');
    expect(res.body.data.mappings.length).toBeGreaterThan(0);

    plan = res.body.data;
  });

  it('POST /api/plans/:id/dry-run runs deterministic dry run', async () => {
    const res = await request(app).post(`/api/plans/${plan._id}/dry-run`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.sourceCount).toBe(2);
    expect(res.body.data.summary.acceptedCount).toBe(1);
    expect(res.body.data.summary.rejectedCount).toBe(1);
  });

  it('POST /api/plans/:id/approve approves the migration plan', async () => {
    const res = await request(app)
      .post(`/api/plans/${plan._id}/approve`)
      .send({ approvedBy: 'SENIOR_ENGINEER' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.approvedBy).toBe('SENIOR_ENGINEER');
  });

  it('POST /api/plans/:id/execute executes the approved plan', async () => {
    const res = await request(app)
      .post(`/api/plans/${plan._id}/execute`)
      .send({ user: 'OPERATOR' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.acceptedCount).toBe(1);
    expect(res.body.data.metrics.rejectedCount).toBe(1);
    expect(res.body.data.metrics.targetInsertedCount).toBe(1);

    const runId = res.body.data.run._id;

    // Verify rollback endpoint
    const rollbackRes = await request(app)
      .post(`/api/runs/${runId}/rollback`)
      .send({ user: 'OPERATOR' });

    expect(rollbackRes.status).toBe(200);
    expect(rollbackRes.body.success).toBe(true);
    expect(rollbackRes.body.data.deletedCount).toBe(1);
  });
});
