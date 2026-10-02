import { planService } from '../services/planService.js';

export const generateAIPlan = async (req, res, next) => {
  try {
    const result = await planService.generatePlanWithAI(req.params.id);
    res.status(201).json({
      success: true,
      data: result.plan,
      aiMetadata: result.aiMetadata,
    });
  } catch (err) {
    next(err);
  }
};

export const getPlansByProject = async (req, res, next) => {
  try {
    const plans = await planService.getPlansByProject(req.params.id);
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

export const editPlan = async (req, res, next) => {
  try {
    const user = req.body.user || 'HUMAN_OPERATOR';
    const plan = await planService.editPlan(req.params.id, req.body, user);
    res.status(201).json({
      success: true,
      data: plan,
      message: `Created new plan version v${plan.version}. Requires approval prior to execution.`,
    });
  } catch (err) {
    next(err);
  }
};

export const approvePlan = async (req, res, next) => {
  try {
    const plan = await planService.approvePlan(req.params.id, req.body);
    res.json({
      success: true,
      data: plan,
      message: `Plan v${plan.version} approved successfully by ${plan.approvedBy}. Ready for execution.`,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectPlan = async (req, res, next) => {
  try {
    const plan = await planService.rejectPlan(req.params.id, req.body);
    res.json({
      success: true,
      data: plan,
      message: `Plan v${plan.version} rejected. Execution blocked.`,
    });
  } catch (err) {
    next(err);
  }
};
