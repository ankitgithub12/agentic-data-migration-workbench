import mongoose from 'mongoose';

const targetCustomerSchema = new mongoose.Schema(
  {
    customerId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    migrationRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MigrationRun',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rawAttributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on customerId to prevent duplicates across target system
targetCustomerSchema.index({ customerId: 1 }, { unique: true });

export const TargetCustomer = mongoose.model('TargetCustomer', targetCustomerSchema);
