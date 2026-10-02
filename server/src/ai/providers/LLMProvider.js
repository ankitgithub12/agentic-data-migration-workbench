/**
 * Abstract Base LLM Provider Interface
 */
export class LLMProvider {
  /**
   * Generates a structured migration plan from schemas and sample records
   * @param {Object} params
   * @param {Object} params.sourceSchema
   * @param {Object} params.targetSchema
   * @param {Array} params.sampleRecords (first N records to avoid token blowout)
   * @param {Array<string>} params.supportedTransformations
   * @returns {Promise<Object>} Unvalidated structured JSON response
   */
  async generatePlan({ sourceSchema, targetSchema, sampleRecords, supportedTransformations }) {
    throw new Error('generatePlan must be implemented by provider');
  }
}
