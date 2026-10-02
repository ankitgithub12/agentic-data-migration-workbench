/**
 * Client-Side Deterministic Transformation Preview Utility
 * Mirrors backend TransformationRegistry for zero-latency live previews in the UI.
 */

export const TransformationRegistry = {
  DIRECT: (value) => value,

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
    if (value === null || value === undefined || value === '') return null;
    const cleanStr = String(value).replace(/,/g, '').trim();
    const num = Number(cleanStr);
    return isNaN(num) ? '[ERR: Not a number]' : num;
  },

  NUMBER_TO_STRING: (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  DATE_ISO: (value) => TransformationRegistry.DATE_TO_ISO(value),

  DATE_TO_ISO: (value) => {
    if (value === null || value === undefined || value === '') return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return '[ERR: Invalid Date]';
    return date.toISOString().split('T')[0];
  },

  BOOLEAN_NORMALIZE: (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    if (['true', '1', 'yes', 'y', 't'].includes(str)) return true;
    if (['false', '0', 'no', 'n', 'f'].includes(str)) return false;
    return '[ERR: Not Boolean]';
  },

  NULL_TO_DEFAULT: (value, config = {}) => {
    const defaultValue = config?.defaultValue !== undefined ? config.defaultValue : 'N/A';
    if (value === null || value === undefined || value === '') return defaultValue;
    return value;
  },

  SPLIT_FULL_NAME: (value) => {
    if (value === null || value === undefined) return { firstName: '', lastName: '' };
    const parts = String(value).trim().split(/\s+/);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      return { firstName: '', lastName: '' };
    }
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  },
};

export const previewTransformRecord = (sourceRecord, mappings) => {
  if (!sourceRecord || !Array.isArray(mappings)) return {};
  const result = {};

  for (const mapping of mappings) {
    const { sourceField, targetField, transformation, transformationConfig } = mapping;
    if (!targetField) continue;
    const rawVal = sourceRecord[sourceField];

    try {
      const fn = TransformationRegistry[transformation] || TransformationRegistry.DIRECT;
      result[targetField] = fn(rawVal, transformationConfig);
    } catch (err) {
      result[targetField] = `[Transform Error: ${err.message}]`;
    }
  }

  return result;
};
