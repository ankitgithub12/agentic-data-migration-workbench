# Agent Usage & AI Collaboration Report

This document records the interaction, delegation patterns, representative prompts, verification processes, and real AI mistakes encountered during the development of the **Agentic Data Migration Planner and Reconciliation Workbench**.

---

## 1. Tools & Models Used

- **AI Pair Programming Assistant**: Antigravity IDE (Gemini 3.8 Flash model)
- **Runtime LLM Integration Options**:
  - Google Gemini API (`gemini-1.5-flash`) via REST API
  - OpenAI Compatible API (`gpt-4o-mini`) via REST API
  - Deterministic Offline Fallback (`MockProvider`) using semantic heuristic matching
- **Verification & Validation**:
  - Zod runtime schema validation
  - Vitest test runner (39 tests across 7 test suites)
  - Pino structured JSON logging
  - End-to-end integration script (`verify_e2e.js`)

---

## 2. Representative Prompts

Below are representative system and user prompts used to prompt the AI agent and guide generation.

### Prompt: Schema Mapping and Risk Analysis Generation
```text
You are an expert data migration agent. Analyze the provided source schema, target schema, sample source records, and supported transformations.
Propose field mappings, identify risks, draft clarification questions, and outline the migration plan.

Source Schema:
{
  "name": "legacy_customers",
  "fields": {
    "customer_id": { "type": "number", "required": true },
    "full_name": { "type": "string", "required": true },
    "email_address": { "type": "string", "required": true, "format": "email" },
    "phone": { "type": "string", "required": false },
    "created": { "type": "string", "required": true }
  }
}

Target Schema:
{
  "name": "customers",
  "fields": {
    "customerId": { "type": "number", "required": true },
    "name": { "type": "string", "required": true, "minLength": 2 },
    "email": { "type": "string", "required": true, "format": "email" },
    "phoneNumber": { "type": "string", "required": false },
    "createdAt": { "type": "date", "required": true }
  }
}

Sample Records (First 5 records):
[
  { "customer_id": 101, "full_name": "Rahul Sharma", "email_address": "rahul@gmail.com", "phone": "9876543210", "created": "2026-09-20" },
  { "customer_id": 102, "full_name": "Priya Patel", "email_address": "priya@gmail.com", "phone": "9876543211", "created": "2026-09-21" }
]

Supported Transformations:
["DIRECT", "STRING_TRIM", "LOWERCASE", "UPPERCASE", "STRING_TO_NUMBER", "NUMBER_TO_STRING", "DATE_ISO", "DATE_TO_ISO", "BOOLEAN_NORMALIZE", "NULL_TO_DEFAULT", "SPLIT_FULL_NAME"]

IMPORTANT RULES:
1. Every mapping transformation MUST be one of the supported transformations listed above.
2. Provide an advisory confidence between 0.0 and 1.0 (do not present confidence as certainty).
3. Identify unmapped required fields as risks.
4. Output STRICT JSON conforming to the requested schema.
```

---

## 3. Delegated Work vs. Deterministic Architecture

| Responsibility | Handled By | Rationale |
| :--- | :--- | :--- |
| **Field Mapping Proposal** | AI Agent | Semantic similarity matching between disparate field names (e.g. `full_name` $\to$ `name`). |
| **Risk Detection** | AI Agent | Identifying unmapped target fields or sample data format risks. |
| **Clarification Questions** | AI Agent | Formulating questions when target fields lack source counterparts. |
| **Output Schema Validation** | Deterministic (Zod) | Ensuring LLM output matches strict JSON structure before reaching the application. |
| **Field Transformations** | Deterministic (`TransformationRegistry`) | Eliminates prompt injection and prohibits arbitrary JavaScript or Python code execution. |
| **Schema Validation** | Deterministic (`validator.js`) | Evaluates RFC email regex, date parsing, numbers, and required fields without AI hallucination. |
| **Plan Approval Gate** | Human Operator | Enforces explicit human sign-off; execution is impossible without approval. |
| **Duplicate Prevention** | Deterministic (Unique Index & Idempotency) | Unique keys guarantee idempotent writes and retry safety. |
| **Count Reconciliation** | Deterministic (`reconciler.js`) | Verifies exact counts ($S = A + R$, $T = A - D$). Discrepancies fail reconciliation. |
| **Selective Rollback** | Deterministic (`engine.js`) | Targets strictly records created in that run; blocks repeated rollback attempts. |

---

## 4. Important Real AI Mistakes Encountered During Development

During the course of building this application, the following real mistakes and edge cases were identified and systematically resolved:

### 1. Unsupported Transformation Suggestion in Test Suite
- **Encountered**: When testing the AI safety validation boundary (`ai.test.js`), an LLM mock returned an unsupported transformation name (`UNSUPPORTED_ARBITRARY_JS_EVAL`).
- **Correction**: The strict Zod enum refinement on `fieldMappingSchema` detected that `UNSUPPORTED_ARBITRARY_JS_EVAL` was not in `SUPPORTED_TRANSFORMATIONS`, rejected the payload, and raised a descriptive validation error preventing its inclusion in any migration plan.

### 2. Null Value Handling in `getSourceRecordId`
- **Encountered**: During the end-to-end dry run verification across 100 sample records, Record #193 had `customer_id: null` to deliberately test missing ID behavior. The original logic used:
  ```javascript
  if (sourceRecord.customer_id !== undefined) return sourceRecord.customer_id;
  ```
  Since `null !== undefined` is `true`, it returned `null`, which caused Mongoose schema validation on `QuarantinedRecord.sourceRecordId` to reject insertion because `sourceRecordId` was required.
- **Correction**: Updated `getSourceRecordId` to explicitly check for `null` and empty strings:
  ```javascript
  if (sourceRecord.customer_id !== undefined && sourceRecord.customer_id !== null && sourceRecord.customer_id !== '') {
    return sourceRecord.customer_id;
  }
  return `rec_${index + 1}`;
  ```
  This cleanly assigned fallback ID `rec_93`, allowing the record to be properly quarantined with field error evidence.

### 3. Parallel Database Test Collisions in Vitest
- **Encountered**: Initially, Vitest ran test suites concurrently with multiple worker threads. Test suites connecting to MongoDB concurrently executed `beforeEach(() => deleteMany({}))`, resulting in one test wiping data while another test was mid-execution.
- **Correction**: Created `server/vitest.config.js` with `fileParallelism: false` to ensure integration tests run sequentially with clean teardowns between suites.

### 4. Over-Constrained Target Model Schema
- **Encountered**: In `approval.test.js`, the test schema tested a minimal record (`customer_id`, `full_name`). The Mongoose `TargetCustomer` model initially required `email` as a mandatory database field, causing insertion to fail in test environments where `email` wasn't part of the bounded subset.
- **Correction**: Decoupled database-level constraints by providing flexible defaults on `TargetCustomer` and relying on the project's **target schema definition** via `validateRecordAgainstSchema` to enforce required fields deterministically.

---

## 5. Verification Methodology

Every AI-generated component was verified through multiple testing tiers:

1. **Zod Schema Validation**: AI outputs are validated immediately upon generation. If any field or type violates the contract, an `AI_OUTPUT_VALIDATION_FAILED` structured log is produced, and the UI displays an error with a retry button.
2. **Automated Unit & Integration Tests**: 39 Vitest tests validating transformations, schema rules, approval state transitions, rollback safety, and idempotency.
3. **End-to-End Workflow Verification**: An automated script (`server/src/verify_e2e.js`) executed all 12 stages against the live running server (health, projects, AI analysis, unapproved plan execution rejection, dry run, human approval, execution, retry duplicate check, quarantine inspection, selective rollback, repeated rollback block, and frontend serving).
4. **Dry Run Comparison**: Comparing expected counts ($100$ records = $90$ accepted + $10$ rejected + $4$ duplicates $\to$ $86$ target inserts).
