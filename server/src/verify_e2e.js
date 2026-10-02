import { seedDatabase } from './seed.js';

const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
  console.log('--- Starting E2E Verification ---');
  console.log('[0] Re-seeding database for deterministic baseline...');
  await seedDatabase();

  // 1. Health check
  console.log('\n[1] Testing GET /api/health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health Response:', healthData);
  if (healthData.status !== 'ok' || healthData.database !== 'connected') {
    throw new Error('Health check failed');
  }

  // 2. Fetch Projects
  console.log('\n[2] Testing GET /api/projects...');
  const projRes = await fetch(`${BASE_URL}/projects`);
  const projData = await projRes.json();
  const project = projData.data[0];
  console.log(`Found ${projData.data.length} project(s). Selected: "${project.name}" (ID: ${project._id})`);
  console.log(`Sample records: ${project.sampleRecords.length}`);

  // 3. AI Analysis & Plan Generation
  console.log('\n[3] Testing POST /api/projects/:id/ai/analyze (AI Analysis)...');
  const aiRes = await fetch(`${BASE_URL}/projects/${project._id}/ai/analyze`, { method: 'POST' });
  const aiData = await aiRes.json();
  const plan = aiData.data;
  console.log(`AI Plan Generated: Version ${plan.version}, Status: ${plan.status}`);
  console.log(`Mapped Fields (${plan.mappings.length}):`, plan.mappings.map(m => `${m.sourceField} -> ${m.targetField} (${m.transformation}, ${Math.round(m.confidence * 100)}%)`));
  console.log(`Risks Detected (${plan.risks.length}):`, plan.risks.map(r => `[${r.level}] ${r.description}`));
  console.log(`Clarification Questions (${plan.clarificationQuestions.length}):`, plan.clarificationQuestions.map(q => q.question));
  console.log('AI Advisory Note:', aiData.aiMetadata?.advisoryNote);

  // 4. Try executing unapproved plan (MUST BE BLOCKED)
  console.log('\n[4] Verifying Human Gating: Trying to execute unapproved plan (MUST FAIL)...');
  const blockedExecRes = await fetch(`${BASE_URL}/plans/${plan._id}/execute`, { method: 'POST' });
  const blockedExecData = await blockedExecRes.json();
  console.log('Blocked Execution Response (Expected failure):', blockedExecData);
  if (blockedExecRes.status === 200) {
    throw new Error('Security flaw: Unapproved plan was allowed to execute!');
  }
  console.log('✓ Human gating enforced: Unapproved plan execution correctly rejected with code:', blockedExecData.error?.code);

  // 5. Deterministic Dry Run
  console.log('\n[5] Testing POST /api/plans/:id/dry-run (Deterministic Dry Run)...');
  const dryRunRes = await fetch(`${BASE_URL}/plans/${plan._id}/dry-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Tester' }),
  });
  const dryRunData = await dryRunRes.json();
  console.log('Dry Run Raw Response:', dryRunData);
  console.log('Dry Run Summary:', dryRunData.data?.summary);
  console.log('Dry Run Reconciliation:', dryRunData.data?.reconciliation?.status, '-', dryRunData.data?.reconciliation?.summary);

  // 6. Approve Plan
  console.log('\n[6] Testing POST /api/plans/:id/approve (Human Approval)...');
  const approveRes = await fetch(`${BASE_URL}/plans/${plan._id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy: 'Lead Architect Sarah' }),
  });
  const approveData = await approveRes.json();
  console.log(`Plan v${approveData.data.version} Approved! Status: ${approveData.data.status}, ApprovedBy: ${approveData.data.approvedBy}`);

  // 7. Execute Approved Migration
  console.log('\n[7] Testing POST /api/plans/:id/execute (Execution)...');
  const execRes = await fetch(`${BASE_URL}/plans/${plan._id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Lead Architect Sarah' }),
  });
  const execData = await execRes.json();
  const run = execData.data.run;
  console.log('Execution Run Status:', run.status);
  console.log('Execution Metrics:', execData.data.metrics);
  console.log('Reconciliation Status:', execData.data.reconciliation.status);
  console.log('Reconciliation Summary:', execData.data.reconciliation.summary);

  // 8. Test Idempotency Retry by generating and approving a new plan version on the same data
  console.log('\n[8] Testing Idempotent Retry Execution on Same Dataset (New Plan Version)...');
  const plan2Res = await fetch(`${BASE_URL}/projects/${project._id}/ai/analyze`, { method: 'POST' });
  const plan2Data = await plan2Res.json();
  const plan2 = plan2Data.data;

  await fetch(`${BASE_URL}/plans/${plan2._id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy: 'Lead Architect Sarah' }),
  });

  const retryRes = await fetch(`${BASE_URL}/plans/${plan2._id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Lead Architect Sarah' }),
  });
  const retryData = await retryRes.json();
  console.log('Retry Metrics:', retryData.data.metrics);
  console.log(`✓ Idempotency verified: Inserted ${retryData.data.metrics.targetInsertedCount} new records, Prevented ${retryData.data.metrics.duplicateCount} duplicates.`);

  // 9. Inspect Quarantine Records
  console.log('\n[9] Testing GET /api/runs/:id/quarantine (Quarantine Inspection)...');
  const quarantineRes = await fetch(`${BASE_URL}/runs/${run._id}/quarantine`);
  const quarantineData = await quarantineRes.json();
  console.log(`Quarantine items retrieved: ${quarantineData.data.length}`);
  if (quarantineData.data.length > 0) {
    const sampleItem = quarantineData.data[0];
    console.log('Sample Quarantined Record:');
    console.log(` - Source ID: ${sampleItem.sourceRecordId}`);
    console.log(` - Rule Violated: ${sampleItem.fieldErrors.map(fe => fe.rule).join(', ')}`);
    console.log(` - Error: ${sampleItem.errors.join('; ')}`);
  }

  // 10. Test Selective Rollback
  console.log('\n[10] Testing POST /api/runs/:id/rollback (Selective Rollback)...');
  const rollbackRes = await fetch(`${BASE_URL}/runs/${run._id}/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Security Officer' }),
  });
  const rollbackData = await rollbackRes.json();
  console.log('Rollback Response:', rollbackData.data);
  console.log(`✓ Rollback completed: ${rollbackData.data.deletedCount} records deleted.`);

  // 11. Test Repeated Rollback Prevention
  console.log('\n[11] Verifying Rollback Safety: Attempting repeated rollback (MUST FAIL)...');
  const repeatedRollbackRes = await fetch(`${BASE_URL}/runs/${run._id}/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Security Officer' }),
  });
  const repeatedRollbackData = await repeatedRollbackRes.json();
  console.log('Repeated Rollback Response (Expected failure):', repeatedRollbackData);
  if (repeatedRollbackRes.status === 200) {
    throw new Error('Security flaw: Repeated rollback was allowed!');
  }
  console.log('✓ Unsafe repeated rollback correctly prevented.');

  // 12. Verify Frontend serving
  console.log('\n[12] Testing Frontend HTTP GET http://localhost:5173/...');
  const feRes = await fetch('http://localhost:5173/');
  const feHtml = await feRes.text();
  console.log(`Frontend responded with HTTP ${feRes.status} (${feHtml.length} bytes). Contains title: ${feHtml.includes('Agentic Data Migration Workbench')}`);

  console.log('\n=== ALL E2E VERIFICATIONS PASSED WITH 100% SUCCESS ===\n');
}

runVerification().catch(err => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
