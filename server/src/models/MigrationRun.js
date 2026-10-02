import mongoose from 'mongoose';

const migrationRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationProject',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationPlan',
      required: true,
      index: true,
    },
    planVersion: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['DRY_RUN', 'EXECUTION'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'],
      default: 'PENDING',
      index: true,
    },
    sourceCount: {
      type: Number,
      default: 0,
    },
    transformedCount: {
      type: Number,
      default: 0,
    },
    acceptedCount: {
      type: Number,
      default: 0,
    },
    rejectedCount: {
      type: Number,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    targetInsertedCount: {
      type: Number,
      default: 0,
    },
    reconciliationStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'PASSED', 'FAILED'],
      default: 'PENDING',
    },
    reconciliationDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    insertedTargetIds: {
      type: [String],
      default: [],
    },
    errors: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rolledBackAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

migrationRunSchema.index({ projectId: 1, createdAt: -1 });
migrationRunSchema.index({ planId: 1, type: 1 });

export const MigrationRun = mongoose.model('MigrationRun', migrationRunSchema);
