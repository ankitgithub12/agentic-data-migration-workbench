import { projectService } from '../services/projectService.js';
import { auditService } from '../services/auditService.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const getAllProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const data = await projectService.getProjectById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getProjectHistory = async (req, res, next) => {
  try {
    const history = await auditService.getProjectHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};
