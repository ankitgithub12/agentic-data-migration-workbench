import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        'PROJECT_CREATED',
        'PLAN_CREATED',
        'PLAN_EDITED',
        'PLAN_APPROVED',
        'PLAN_REJECTED',
        'DRY_RUN_STARTED',
        'DRY_RUN_COMPLETED',
        'DRY_RUN_FAILED',
        'MIGRATION_STARTED',
        'MIGRATION_COMPLETED',
        'MIGRATION_FAILED',
        'MIGRATION_ROLLED_BACK',
      ],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationProject',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationPlan',
      default: null,
      index: true,
    },
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationRun',
      default: null,
      index: true,
    },
    actor: {
      type: String,
      default: 'HUMAN_OPERATOR',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ projectId: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
