import { z } from 'zod';

/**
 * Deterministic Record Validator
 * Validates transformed records against schema specifications without AI intervention.
 */

// Email regex matching standard RFC 5322 subset
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone number: at least 7 digits, optional +, -, spaces, parentheses
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

/**
 * Validates a single transformed record against the target schema definition.
 * 
 * @param {Object} record Transformed record
 * @param {Object} targetSchema Target schema definition
 * @returns {{ isValid: boolean, fieldErrors: Array<{field: string, value: any, error: string, rule: string}>, errors: string[] }}
 */
export const validateRecordAgainstSchema = (record, targetSchema) => {
  const fieldErrors = [];
  const errors = [];

  const fields = targetSchema?.fields || {};

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const value = record[fieldName];
    const isRequired = Boolean(fieldDef.required);
    const expectedType = fieldDef.type?.toLowerCase() || 'string';

    // 1. Required field check
    if (isRequired && (value === undefined || value === null || value === '')) {
      const err = `Field "${fieldName}" is required but was missing or empty`;
      fieldErrors.push({
        field: fieldName,
        value,
        error: err,
        rule: 'REQUIRED_FIELD',
      });
      errors.push(err);
      continue; // Skip further checks for missing required field
    }

    // If optional and empty, skip remaining validations
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // 2. Type validation
    if (expectedType === 'number') {
      const num = Number(value);
      if (typeof value !== 'number' && isNaN(num)) {
        const err = `Field "${fieldName}" expects number, received ${typeof value} ("${value}")`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'TYPE_NUMBER',
        });
        errors.push(err);
      } else if (fieldDef.min !== undefined && num < fieldDef.min) {
        const err = `Field "${fieldName}" must be at least ${fieldDef.min}`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'MIN_VALUE',
        });
        errors.push(err);
      }
    } else if (expectedType === 'string') {
      if (typeof value !== 'string') {
        const err = `Field "${fieldName}" expects string, received ${typeof value}`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'TYPE_STRING',
        });
        errors.push(err);
      } else {
        // String length constraints
        if (fieldDef.minLength && value.length < fieldDef.minLength) {
          const err = `Field "${fieldName}" length must be >= ${fieldDef.minLength}`;
          fieldErrors.push({
            field: fieldName,
            value,
            error: err,
            rule: 'MIN_LENGTH',
          });
          errors.push(err);
        }
        if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
          const err = `Field "${fieldName}" length must be <= ${fieldDef.maxLength}`;
          fieldErrors.push({
            field: fieldName,
            value,
            error: err,
            rule: 'MAX_LENGTH',
          });
          errors.push(err);
        }
      }
    } else if (expectedType === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        const err = `Field "${fieldName}" must be a valid date, received "${value}"`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'FORMAT_DATE',
        });
        errors.push(err);
      }
    } else if (expectedType === 'boolean') {
      if (typeof value !== 'boolean') {
        const err = `Field "${fieldName}" expects boolean, received ${typeof value}`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'TYPE_BOOLEAN',
        });
        errors.push(err);
      }
    }

    // 3. Format validations (Email, Phone, Regex)
    if (fieldDef.format === 'email' || fieldName.toLowerCase().includes('email')) {
      if (typeof value === 'string' && !EMAIL_REGEX.test(value.trim())) {
        const err = `Invalid email format for "${fieldName}": "${value}"`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'FORMAT_EMAIL',
        });
        errors.push(err);
      }
    }

    if (fieldDef.format === 'phone' || fieldName.toLowerCase().includes('phone')) {
      if (typeof value === 'string' && !PHONE_REGEX.test(value.replace(/[\s()-]/g, ''))) {
        const err = `Invalid phone number format for "${fieldName}": "${value}"`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'FORMAT_PHONE',
        });
        errors.push(err);
      }
    }

    // 4. Enum validation
    if (Array.isArray(fieldDef.enum) && fieldDef.enum.length > 0) {
      if (!fieldDef.enum.includes(value)) {
        const err = `Field "${fieldName}" value "${value}" not in allowed values: [${fieldDef.enum.join(', ')}]`;
        fieldErrors.push({
          field: fieldName,
          value,
          error: err,
          rule: 'ENUM_CONSTRAINT',
        });
        errors.push(err);
      }
    }
  }

  return {
    isValid: fieldErrors.length === 0,
    fieldErrors,
    errors,
  };
};
