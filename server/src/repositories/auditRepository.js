import { AuditLog } from '../models/AuditLog.js';

export class AuditRepository {
  async log(entry) {
    const log = new AuditLog(entry);
    return await log.save();
  }

  async findByProject(projectId, limit = 100) {
    return await AuditLog.find({ projectId }).sort({ timestamp: -1 }).limit(limit);
  }

  async findRecent(limit = 20) {
    return await AuditLog.find().populate('projectId', 'name').sort({ timestamp: -1 }).limit(limit);
  }
}

export const auditRepository = new AuditRepository();
