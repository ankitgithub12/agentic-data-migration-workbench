/**
 * Deterministic Reconciliation Engine
 * Strictly reconciles source, transformed, accepted, rejected, duplicates, and target inserts.
 * Discrepancies immediately fail reconciliation.
 */

export const reconcileMigrationRun = ({
  sourceCount,
  transformedCount,
  acceptedCount,
  rejectedCount,
  duplicateCount,
  targetInsertedCount,
  isDryRun = false,
}) => {
  const issues = [];

  // Invariant 1: Source count must equal Accepted + Rejected + (any untransformed/dropped)
  const totalAccountedFor = acceptedCount + rejectedCount;
  if (totalAccountedFor !== sourceCount) {
    issues.push(
      `Count mismatch: Source records (${sourceCount}) != Accepted (${acceptedCount}) + Rejected (${rejectedCount}) [Sum: ${totalAccountedFor}]`
    );
  }

  // Invariant 2: Transformed count should equal accepted + rejected attempts
  if (transformedCount !== sourceCount) {
    issues.push(
      `Transformation gap: ${sourceCount} source records read but only ${transformedCount} records transformed.`
    );
  }

  // Invariant 3: For an actual execution: Target inserted records must match (acceptedCount - duplicateCount)
  if (!isDryRun) {
    const expectedInserts = acceptedCount - duplicateCount;
    if (targetInsertedCount !== expectedInserts) {
      issues.push(
        `Target insert discrepancy: Expected ${expectedInserts} new inserts (Accepted ${acceptedCount} - Duplicates ${duplicateCount}), but actual inserted was ${targetInsertedCount}.`
      );
    }
  }

  const passed = issues.length === 0;

  return {
    status: passed ? 'PASSED' : 'FAILED',
    passed,
    timestamp: new Date().toISOString(),
    metrics: {
      sourceCount,
      transformedCount,
      acceptedCount,
      rejectedCount,
      duplicateCount,
      targetInsertedCount,
      isDryRun,
    },
    issues,
    summary: passed
      ? `Reconciliation passed: All ${sourceCount} records accounted for (${acceptedCount} accepted, ${rejectedCount} rejected, ${duplicateCount} duplicates, ${targetInsertedCount} target inserts).`
      : `Reconciliation failed with ${issues.length} discrepancy: ${issues.join('; ')}`,
  };
};
