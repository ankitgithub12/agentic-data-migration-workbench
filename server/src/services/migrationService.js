import { planRepository } from '../repositories/planRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { runRepository } from '../repositories/runRepository.js';
import { quarantineRepository } from '../repositories/quarantineRepository.js';
import { MigrationEngine } from '../migration/engine.js';

export class MigrationService {
  async runDryRun(planId, user = 'HUMAN_OPERATOR') {
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }

    const projectId = plan.projectId?._id || plan.projectId;
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    return await MigrationEngine.runDryRun({ project, plan, user });
  }

  async executeMigration(planId, user = 'HUMAN_OPERATOR') {
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found.`);
    }

    if (plan.status !== 'APPROVED') {
      throw new Error(`Execution blocked: Migration plan is in status "${plan.status}". Only APPROVED plans can be executed.`);
    }

    const projectId = plan.projectId?._id || plan.projectId;
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    return await MigrationEngine.executeMigration({ project, plan, user });
  }

  async rollback(runId, user = 'HUMAN_OPERATOR') {
    return await MigrationEngine.rollbackMigration({ runId, user });
  }

  async getRunById(runId) {
    const run = await runRepository.findById(runId);
    if (!run) {
      throw new Error(`Migration run with ID ${runId} not found.`);
    }
    return run;
  }

  async getRunsByProject(projectId) {
    return await runRepository.findByProject(projectId);
  }

  async getQuarantinedRecords(runId, { page = 1, limit = 50 } = {}) {
    return await quarantineRepository.findByRun(runId, { page, limit });
  }
}

export const migrationService = new MigrationService();
