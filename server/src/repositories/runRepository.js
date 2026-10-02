import { MigrationRun } from '../models/MigrationRun.js';

export class RunRepository {
  async findById(id) {
    return await MigrationRun.findById(id).populate('planId');
  }

  async findByProject(projectId) {
    return await MigrationRun.find({ projectId }).sort({ createdAt: -1 });
  }

  async findByPlan(planId) {
    return await MigrationRun.find({ planId }).sort({ createdAt: -1 });
  }

  async findRecent(limit = 10) {
    return await MigrationRun.find()
      .populate('projectId', 'name')
      .populate('planId', 'version status')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const runRepository = new RunRepository();
