import mongoose from 'mongoose';

const quarantinedRecordSchema = new mongoose.Schema(
  {
    migrationRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationRun',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationProject',
      required: true,
      index: true,
    },
    sourceRecordId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    sourceRecord: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    errors: {
      type: [String],
      default: [],
    },
    fieldErrors: [
      {
        field: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed },
        error: { type: String, required: true },
        rule: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

quarantinedRecordSchema.index({ migrationRunId: 1, sourceRecordId: 1 });

export const QuarantinedRecord = mongoose.model('QuarantinedRecord', quarantinedRecordSchema);
