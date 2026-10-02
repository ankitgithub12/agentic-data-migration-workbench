import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  getProjectHistory,
} from '../controllers/projectController.js';
import { generateAIPlan, getPlansByProject } from '../controllers/planController.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createProjectSchema } from '../validators/schemas.js';

const router = express.Router();

router.route('/')
  .get(getAllProjects)
  .post(validateBody(createProjectSchema), createProject);

router.route('/:id')
  .get(getProjectById);

router.route('/:id/history')
  .get(getProjectHistory);

// AI analysis and plan generation for a project
router.route('/:id/ai/analyze')
  .post(generateAIPlan);

// Plans belonging to a project
router.route('/:id/plans')
  .get(getPlansByProject)
  .post(generateAIPlan);

export default router;
