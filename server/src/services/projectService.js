import { projectRepository } from '../repositories/projectRepository.js';
import { planRepository } from '../repositories/planRepository.js';
import { runRepository } from '../repositories/runRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { createProjectSchema } from '../validators/schemas.js';

export class ProjectService {
  async createProject(data) {
    const validated = createProjectSchema.parse(data);
    const project = await projectRepository.create(validated);

    await auditRepository.log({
      event: 'PROJECT_CREATED',
      projectId: project._id,
      actor: 'HUMAN_OPERATOR',
      metadata: {
        name: project.name,
        sampleRecordsCount: project.sampleRecords.length,
      },
    });

    return project;
  }

  async getAllProjects() {
    const projects = await projectRepository.findAll();
    // Attach counts and latest plan
    const enhanced = await Promise.all(
      projects.map(async (p) => {
        const latestPlan = await planRepository.findLatestPlan(p._id);
        const runs = await runRepository.findByProject(p._id);
        const lastExecution = runs.find((r) => r.type === 'EXECUTION');
        return {
          ...p.toObject(),
          latestPlanVersion: latestPlan ? latestPlan.version : 0,
          latestPlanStatus: latestPlan ? latestPlan.status : 'NO_PLAN',
          totalRuns: runs.length,
          lastExecutionStatus: lastExecution ? lastExecution.status : null,
          lastExecutionAt: lastExecution ? lastExecution.createdAt : null,
        };
      })
    );
    return enhanced;
  }

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    const plans = await planRepository.findByProject(id);
    const runs = await runRepository.findByProject(id);
    return {
      project,
      plans,
      runs,
    };
  }

  async injectChaosDataset(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const chaosRecords = [
      { customer_id: 881, full_name: '   Prof.  Aditya  Verma   ', email_address: 'aditya.verma@enterprise.com', phone: '+91 98765 43210', created: '2026-09-01' },
      { customer_id: null, full_name: 'Quarantine: Missing Customer ID', email_address: 'missing_id@domain.com', phone: '9988776655', created: '2026-09-02' },
      { customer_id: 882, full_name: 'Quarantine: Invalid Email RFC', email_address: 'corrupt-email-without-at', phone: '9988776654', created: '2026-09-03' },
      { customer_id: 883, full_name: 'Quarantine: Corrupted Date Value', email_address: 'date_bad@domain.com', phone: '9988776653', created: '32-13-2026-UNKNOWN' },
      { customer_id: 884, full_name: 'Unicode Character & Emoji 🚀✨', email_address: 'emoji.user@domain.com', phone: '9988776652', created: '2026-09-05' },
      { customer_id: 881, full_name: 'Duplicate Key Injection (Aditya 2)', email_address: 'aditya.duplicate@enterprise.com', phone: '+91 98765 43210', created: '2026-09-06' },
      { customer_id: 885, full_name: '', email_address: 'empty_name@domain.com', phone: '9988776650', created: '2026-09-07' },
      { customer_id: 886, full_name: 'Rohan Deshmukh', email_address: 'rohan.deshmukh@enterprise.com', phone: '9876543219', created: '2026-09-08' },
    ];

    project.sampleRecords = [...project.sampleRecords, ...chaosRecords];
    await project.save();

    await auditRepository.log({
      event: 'PLAN_EDITED',
      projectId: project._id,
      actor: 'HUMAN_OPERATOR',
      metadata: {
        action: 'INJECT_CHAOS_DATASET',
        injectedCount: chaosRecords.length,
        totalSampleRecords: project.sampleRecords.length,
      },
    });

    return project;
  }
}

export const projectService = new ProjectService();
