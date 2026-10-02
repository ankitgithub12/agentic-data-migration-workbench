import { migrationService } from '../services/migrationService.js';
import { runRepository } from '../repositories/runRepository.js';

export const runDryRun = async (req, res, next) => {
  try {
    const user = req.body.user || 'HUMAN_OPERATOR';
    const result = await migrationService.runDryRun(req.params.id, user);
    res.json({
      success: true,
      data: result,
      message: 'Dry run completed successfully. No records were written to target database.',
    });
  } catch (err) {
    next(err);
  }
};

export const executeMigration = async (req, res, next) => {
  try {
    const user = req.body.user || 'HUMAN_OPERATOR';
    const result = await migrationService.executeMigration(req.params.id, user);
    res.json({
      success: true,
      data: result,
      message: 'Approved migration executed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const rollbackMigration = async (req, res, next) => {
  try {
    const user = req.body.user || 'HUMAN_OPERATOR';
    const result = await migrationService.rollback(req.params.id, user);
    res.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

export const getRunById = async (req, res, next) => {
  try {
    const run = await migrationService.getRunById(req.params.id);
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
};

export const getRecentRuns = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const runs = await runRepository.findRecent(limit);
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
};

export const getQuarantinedRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await migrationService.getQuarantinedRecords(req.params.id, { page, limit });
    res.json({ success: true, data: result.records, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};
