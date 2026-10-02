import { MigrationPlan } from '../models/MigrationPlan.js';

export class PlanRepository {
  async create(planData) {
    const plan = new MigrationPlan(planData);
    return await plan.save();
  }

  async findById(id) {
    return await MigrationPlan.findById(id);
  }

  async findByIdWithProject(id) {
    return await MigrationPlan.findById(id).populate('projectId', 'name');
  }

  async findByProject(projectId) {
    return await MigrationPlan.find({ projectId }).sort({ version: -1 });
  }

  async getLatestVersion(projectId) {
    const latest = await MigrationPlan.findOne({ projectId }).sort({ version: -1 });
    return latest ? latest.version : 0;
  }

  async findLatestPlan(projectId) {
    return await MigrationPlan.findOne({ projectId }).sort({ version: -1 });
  }

  async update(id, updateData) {
    return await MigrationPlan.findByIdAndUpdate(id, updateData, { new: true });
  }
}

export const planRepository = new PlanRepository();
