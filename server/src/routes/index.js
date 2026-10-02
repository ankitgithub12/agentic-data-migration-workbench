import express from 'express';
import projectRoutes from './projectRoutes.js';
import planRoutes from './planRoutes.js';
import runRoutes from './runRoutes.js';
import healthRoutes from './healthRoutes.js';
import { auditService } from '../services/auditService.js';
import { runRepository } from '../repositories/runRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { TargetCustomer } from '../models/TargetCustomer.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/projects', projectRoutes);
router.use('/plans', planRoutes);
router.use('/runs', runRoutes);

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const [projects, recentRuns, recentActivity, targetCount] = await Promise.all([
      projectRepository.findAll(),
      runRepository.findRecent(6),
      auditService.getRecentActivity(10),
      TargetCustomer.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTargetRecords: targetCount,
        recentRuns,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
