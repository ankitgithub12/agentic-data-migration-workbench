import { auditRepository } from '../repositories/auditRepository.js';

export class AuditService {
  async getProjectHistory(projectId, limit = 100) {
    return await auditRepository.findByProject(projectId, limit);
  }

  async getRecentActivity(limit = 20) {
    return await auditRepository.findRecent(limit);
  }
}

export const auditService = new AuditService();
