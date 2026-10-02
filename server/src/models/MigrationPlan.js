import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema(
  {
    sourceField: {
      type: String,
      required: true,
    },
    targetField: {
      type: String,
      required: true,
    },
    transformation: {
      type: String,
      required: true,
      default: 'DIRECT',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    reason: {
      type: String,
      default: '',
    },
    transformationConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: true }
);

const riskSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    field: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    mitigation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const clarificationQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'GENERAL',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    answer: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const migrationPlanSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationProject',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    mappings: {
      type: [mappingSchema],
      default: [],
    },
    unmappedSourceFields: {
      type: [String],
      default: [],
    },
    unmappedTargetFields: {
      type: [String],
      default: [],
    },
    risks: {
      type: [riskSchema],
      default: [],
    },
    clarificationQuestions: {
      type: [clarificationQuestionSchema],
      default: [],
    },
    steps: {
      type: [stepSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXECUTED', 'ROLLED_BACK'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: String,
      default: 'AI_AGENT',
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: String,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    changeNotes: {
      type: String,
      default: 'Initial plan generated',
    },
  },
  {
    timestamps: true,
  }
);

migrationPlanSchema.index({ projectId: 1, version: 1 }, { unique: true });
migrationPlanSchema.index({ projectId: 1, status: 1 });

export const MigrationPlan = mongoose.model('MigrationPlan', migrationPlanSchema);
