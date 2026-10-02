import express from 'express';
import {
  getPlanById,
  editPlan,
  approvePlan,
  rejectPlan,
} from '../controllers/planController.js';
import { runDryRun, executeMigration } from '../controllers/migrationController.js';
import { validateBody } from '../middleware/validateRequest.js';
import { updatePlanSchema, approvePlanSchema, rejectPlanSchema } from '../validators/schemas.js';

const router = express.Router();

router.route('/:id')
  .get(getPlanById)
  .put(validateBody(updatePlanSchema), editPlan);

router.route('/:id/approve')
  .post(validateBody(approvePlanSchema), approvePlan);

router.route('/:id/reject')
  .post(validateBody(rejectPlanSchema), rejectPlan);

// Deterministic dry run on plan
router.route('/:id/dry-run')
  .post(runDryRun);

// Execute approved plan
router.route('/:id/execute')
  .post(executeMigration);

export default router;
