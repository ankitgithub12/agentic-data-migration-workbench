import { MigrationProject } from '../models/MigrationProject.js';

export class ProjectRepository {
  async create(projectData) {
    const project = new MigrationProject(projectData);
    return await project.save();
  }

  async findById(id) {
    return await MigrationProject.findById(id);
  }

  async findAll() {
    return await MigrationProject.find().sort({ createdAt: -1 });
  }

  async update(id, updateData) {
    return await MigrationProject.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id) {
    return await MigrationProject.findByIdAndDelete(id);
  }
}

export const projectRepository = new ProjectRepository();
