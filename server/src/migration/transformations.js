/**
 * Deterministic Transformation Registry
 * Strictly bounded and verifiable transformations.
 * Arbitrary AI code execution is explicitly prohibited.
 */

export class TransformationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'TransformationError';
    this.details = details;
  }
}

export const SUPPORTED_TRANSFORMATIONS = [
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
];

export const TransformationRegistry = {
  DIRECT: (value) => {
    return value;
  },

  STRING_TRIM: (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  },

  LOWERCASE: (value) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase().trim();
  },

  UPPERCASE: (value) => {
    if (value === null || value === undefined) return '';
    return String(value).toUpperCase().trim();
  },

  STRING_TO_NUMBER: (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const cleanStr = String(value).replace(/,/g, '').trim();
    const num = Number(cleanStr);
    if (isNaN(num)) {
      throw new TransformationError(`Cannot convert value "${value}" to a valid number`, {
        value,
        targetType: 'number',
      });
    }
    return num;
  },

  NUMBER_TO_STRING: (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  DATE_ISO: (value) => {
    return TransformationRegistry.DATE_TO_ISO(value);
  },

  DATE_TO_ISO: (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new TransformationError(`Cannot parse "${value}" into a valid ISO date`, {
        value,
        targetType: 'date',
      });
    }
    // Return ISO format YYYY-MM-DD
    return date.toISOString().split('T')[0];
  },

  BOOLEAN_NORMALIZE: (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    if (['true', '1', 'yes', 'y', 't'].includes(str)) return true;
    if (['false', '0', 'no', 'n', 'f'].includes(str)) return false;
    throw new TransformationError(`Cannot normalize value "${value}" to boolean`, { value });
  },

  NULL_TO_DEFAULT: (value, config = {}) => {
    const defaultValue = config?.defaultValue !== undefined ? config.defaultValue : 'N/A';
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value;
  },

  SPLIT_FULL_NAME: (value) => {
    if (value === null || value === undefined) {
      return { firstName: '', lastName: '' };
    }
    const parts = String(value).trim().split(/\s+/);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      return { firstName: '', lastName: '' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  },
};

/**
 * Executes a named transformation deterministically.
 */
export const executeTransformation = (transformationName, value, config = {}) => {
  const normName = transformationName?.toUpperCase()?.trim();
  if (!normName || !TransformationRegistry[normName]) {
    throw new TransformationError(
      `Unsupported transformation: "${transformationName}". Supported: ${SUPPORTED_TRANSFORMATIONS.join(', ')}`,
      { transformation: transformationName }
    );
  }
  return TransformationRegistry[normName](value, config);
};
