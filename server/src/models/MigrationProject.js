import mongoose from 'mongoose';

const migrationProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    sourceSchema: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    targetSchema: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    sampleRecords: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    supportedTransformations: {
      type: [String],
      default: [
        'DIRECT',
        'STRING_TRIM',
        'LOWERCASE',
        'UPPERCASE',
        'STRING_TO_NUMBER',
        'NUMBER_TO_STRING',
        'DATE_ISO',
        'DATE_TO_ISO',
        'BOOLEAN_NORMALIZE',
        'NULL_TO_DEFAULT',
        'SPLIT_FULL_NAME',
      ],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

migrationProjectSchema.index({ name: 1 });
migrationProjectSchema.index({ createdAt: -1 });

export const MigrationProject = mongoose.model('MigrationProject', migrationProjectSchema);
