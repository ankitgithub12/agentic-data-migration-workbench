import { describe, it, expect } from 'vitest';
import {
  TransformationRegistry,
  executeTransformation,
  TransformationError,
} from '../migration/transformations.js';

describe('Deterministic Transformation Registry', () => {
  describe('DIRECT', () => {
    it('returns value unchanged for various types', () => {
      expect(TransformationRegistry.DIRECT('hello')).toBe('hello');
      expect(TransformationRegistry.DIRECT(42)).toBe(42);
      expect(TransformationRegistry.DIRECT(null)).toBe(null);
    });
  });

  describe('STRING_TRIM', () => {
    it('trims leading and trailing whitespace', () => {
      expect(TransformationRegistry.STRING_TRIM('  Rahul Sharma  ')).toBe('Rahul Sharma');
      expect(TransformationRegistry.STRING_TRIM('\t\nhello\n ')).toBe('hello');
      expect(TransformationRegistry.STRING_TRIM(null)).toBe('');
    });
  });

  describe('LOWERCASE', () => {
    it('converts strings to lowercase and trims', () => {
      expect(TransformationRegistry.LOWERCASE('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
      expect(TransformationRegistry.LOWERCASE(null)).toBe('');
    });
  });

  describe('UPPERCASE', () => {
    it('converts strings to uppercase and trims', () => {
      expect(TransformationRegistry.UPPERCASE('active')).toBe('ACTIVE');
    });
  });

  describe('STRING_TO_NUMBER', () => {
    it('converts valid numeric strings to numbers', () => {
      expect(TransformationRegistry.STRING_TO_NUMBER('101')).toBe(101);
      expect(TransformationRegistry.STRING_TO_NUMBER('1,050.50')).toBe(1050.5);
    });

    it('throws TransformationError on non-numeric strings', () => {
      expect(() => TransformationRegistry.STRING_TO_NUMBER('invalid_num')).toThrow(TransformationError);
    });
  });

  describe('DATE_TO_ISO / DATE_ISO', () => {
    it('normalizes valid date strings to ISO YYYY-MM-DD', () => {
      expect(TransformationRegistry.DATE_TO_ISO('2026-09-20')).toBe('2026-09-20');
      expect(TransformationRegistry.DATE_TO_ISO('2026-09-20T14:30:00.000Z')).toBe('2026-09-20');
    });

    it('throws TransformationError on invalid dates', () => {
      expect(() => TransformationRegistry.DATE_TO_ISO('invalid-date-string')).toThrow(TransformationError);
    });
  });

  describe('BOOLEAN_NORMALIZE', () => {
    it('normalizes boolean strings and numbers to boolean', () => {
      expect(TransformationRegistry.BOOLEAN_NORMALIZE('yes')).toBe(true);
      expect(TransformationRegistry.BOOLEAN_NORMALIZE('1')).toBe(true);
      expect(TransformationRegistry.BOOLEAN_NORMALIZE('no')).toBe(false);
      expect(TransformationRegistry.BOOLEAN_NORMALIZE('0')).toBe(false);
      expect(TransformationRegistry.BOOLEAN_NORMALIZE(false)).toBe(false);
    });

    it('throws on unparseable boolean values', () => {
      expect(() => TransformationRegistry.BOOLEAN_NORMALIZE('maybe')).toThrow(TransformationError);
    });
  });

  describe('NULL_TO_DEFAULT', () => {
    it('returns default value when input is null, undefined, or empty', () => {
      expect(TransformationRegistry.NULL_TO_DEFAULT(null, { defaultValue: 'UNKNOWN' })).toBe('UNKNOWN');
      expect(TransformationRegistry.NULL_TO_DEFAULT('', { defaultValue: 'N/A' })).toBe('N/A');
      expect(TransformationRegistry.NULL_TO_DEFAULT('existing', { defaultValue: 'DEFAULT' })).toBe('existing');
    });
  });

  describe('SPLIT_FULL_NAME', () => {
    it('splits full name into firstName and lastName', () => {
      expect(TransformationRegistry.SPLIT_FULL_NAME('Rahul Sharma')).toEqual({
        firstName: 'Rahul',
        lastName: 'Sharma',
      });
      expect(TransformationRegistry.SPLIT_FULL_NAME('Siddharth')).toEqual({
        firstName: 'Siddharth',
        lastName: '',
      });
    });
  });

  describe('executeTransformation', () => {
    it('executes supported transformation case-insensitively', () => {
      expect(executeTransformation('lowercase', 'HELLO')).toBe('hello');
    });

    it('rejects unsupported transformations', () => {
      expect(() => executeTransformation('EVAL_ARBITRARY_JS', 'code')).toThrow(TransformationError);
    });
  });
});
