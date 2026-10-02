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
}

export const projectService = new ProjectService();
