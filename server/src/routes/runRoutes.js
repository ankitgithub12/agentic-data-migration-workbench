import express from 'express';
import {
  getRunById,
  rollbackMigration,
  getQuarantinedRecords,
  getRecentRuns,
} from '../controllers/migrationController.js';

const router = express.Router();

router.route('/recent')
  .get(getRecentRuns);

router.route('/:id')
  .get(getRunById);

router.route('/:id/rollback')
  .post(rollbackMigration);

router.route('/:id/quarantine')
  .get(getQuarantinedRecords);

export default router;
