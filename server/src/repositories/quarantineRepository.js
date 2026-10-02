import { QuarantinedRecord } from '../models/QuarantinedRecord.js';

export class QuarantineRepository {
  async findByRun(migrationRunId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      QuarantinedRecord.find({ migrationRunId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      QuarantinedRecord.countDocuments({ migrationRunId }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findByProject(projectId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      QuarantinedRecord.find({ projectId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      QuarantinedRecord.countDocuments({ projectId }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const quarantineRepository = new QuarantineRepository();
