import { describe, it, expect } from 'vitest';
import { validateRecordAgainstSchema } from '../migration/validator.js';

describe('Deterministic Schema Validator', () => {
  const targetSchema = {
    name: 'customers',
    fields: {
      customerId: { type: 'number', required: true },
      name: { type: 'string', required: true, minLength: 2 },
      email: { type: 'string', required: true, format: 'email' },
      phoneNumber: { type: 'string', required: false, format: 'phone' },
      createdAt: { type: 'date', required: true },
    },
  };

  it('validates a compliant record successfully', () => {
    const record = {
      customerId: 101,
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      phoneNumber: '9876543210',
      createdAt: '2026-09-20',
    };

    const result = validateRecordAgainstSchema(record, targetSchema);
    expect(result.isValid).toBe(true);
    expect(result.fieldErrors).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('flags missing required fields with detailed evidence', () => {
    const record = {
      customerId: 101,
      name: '', // Empty required string
      email: 'rahul@gmail.com',
      createdAt: '2026-09-20',
    };

    const result = validateRecordAgainstSchema(record, targetSchema);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.some((e) => e.field === 'name' && e.rule === 'REQUIRED_FIELD')).toBe(true);
  });

  it('flags invalid email addresses with RFC rule evidence', () => {
    const record = {
      customerId: 102,
      name: 'Priya Patel',
      email: 'priya_without_at_sign',
      createdAt: '2026-09-20',
    };

    const result = validateRecordAgainstSchema(record, targetSchema);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.some((e) => e.field === 'email' && e.rule === 'FORMAT_EMAIL')).toBe(true);
  });

  it('flags unparseable dates with FORMAT_DATE rule evidence', () => {
    const record = {
      customerId: 103,
      name: 'Amit Verma',
      email: 'amit@example.com',
      createdAt: 'not-a-valid-date',
    };

    const result = validateRecordAgainstSchema(record, targetSchema);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.some((e) => e.field === 'createdAt' && e.rule === 'FORMAT_DATE')).toBe(true);
  });

  it('flags number type mismatches when string is non-numeric', () => {
    const record = {
      customerId: 'not_a_number',
      name: 'Sneha Singh',
      email: 'sneha@example.com',
      createdAt: '2026-09-20',
    };

    const result = validateRecordAgainstSchema(record, targetSchema);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.some((e) => e.field === 'customerId' && e.rule === 'TYPE_NUMBER')).toBe(true);
  });
});
