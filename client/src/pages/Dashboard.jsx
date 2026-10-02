import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Database,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
  });

  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (newProject) => api.createProject(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
    },
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    // Default bounded starter schema based on legacy CRM scenario
    const defaultPayload = {
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || 'Data migration bounded project',
      sourceSchema: {
        name: 'legacy_customers',
        fields: {
          customer_id: { type: 'number', required: true },
          full_name: { type: 'string', required: true },
          email_address: { type: 'string', required: true, format: 'email' },
          phone: { type: 'string', required: false },
          created: { type: 'string', required: true },
        },
      },
      targetSchema: {
        name: 'customers',
        fields: {
          customerId: { type: 'number', required: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true, format: 'email' },
          phoneNumber: { type: 'string', required: false },
          createdAt: { type: 'date', required: true },
        },
      },
      sampleRecords: [
        { customer_id: 101, full_name: 'Rahul Sharma', email_address: 'rahul@gmail.com', phone: '9876543210', created: '2026-09-20' },
        { customer_id: 102, full_name: 'Priya Patel', email_address: 'priya@gmail.com', phone: '9876543211', created: '2026-09-21' },
        { customer_id: 103, full_name: 'Invalid Person', email_address: 'bad-email@', phone: '9876543212', created: '2026-09-22' },
      ],
      supportedTransformations: [
        'DIRECT',
        'STRING_TRIM',
        'LOWERCASE',
        'UPPERCASE',
        'STRING_TO_NUMBER',
        'NUMBER_TO_STRING',
        'DATE_ISO',
        'DATE_TO_ISO',
        'BOOLEAN_NORMALIZE',
        'NULL_TO_DEFAULT',
        'SPLIT_FULL_NAME',
      ],
    };

    createMutation.mutate(defaultPayload);
  };

  const projects = projectsData?.data || [];
  const stats = statsData?.data || {};
  const recentRuns = stats.recentRuns || [];
  const recentActivity = stats.recentActivity || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Migration Workbench Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic data migration planning, AI mapping analysis, human approval gating, and reconciliation.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition shadow-lg shadow-sky-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Migration Project
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Projects
            </span>
            <FolderGit2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-100">
            {stats.totalProjects ?? projects.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Configured migration scopes</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Target Ingested
            </span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-400">
            {stats.totalTargetRecords ?? 0}
          </div>
          <p className="mt-1 text-xs text-slate-500">Active records in target store</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Recent Runs
            </span>
            <PlayCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-100">
            {recentRuns.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Dry runs and executions</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Gating Mode
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-amber-400">
            Human Approval
          </div>
          <p className="mt-1 text-xs text-slate-500">Zero unsupervised AI writes</p>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-sky-400" />
            Migration Projects
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center border border-dashed border-slate-800">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No migration projects yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Create your first bounded migration project to configure source and target schemas.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition"
            >
              Create Migration Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="glass-panel p-6 rounded-xl border border-slate-800/80 glass-panel-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100 hover:text-sky-400 transition">
                        <Link to={`/projects/${proj._id}`}>{proj.name}</Link>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {proj.description || 'No description provided'}
                      </p>
                    </div>
                    <StatusBadge status={proj.latestPlanStatus || 'DRAFT'} />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Sample Records</span>
                      <span className="font-mono font-medium text-slate-300">
                        {proj.sampleRecords?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Plan Version</span>
                      <span className="font-mono font-medium text-slate-300">
                        {proj.latestPlanVersion ? `v${proj.latestPlanVersion}` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Runs</span>
                      <span className="font-mono font-medium text-slate-300">
                        {proj.totalRuns || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Schema: {proj.sourceSchema?.name} → {proj.targetSchema?.name}
                  </span>
                  <Link
                    to={`/projects/${proj._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition"
                  >
                    Open Workbench <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Recent Runs and Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-indigo-400" />
              Recent Runs
            </h2>
            <Link to="/runs" className="text-xs text-sky-400 hover:underline">
              View All Runs
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center border border-slate-800 text-sm text-slate-500">
              No migration runs recorded yet. Run a dry run or execute an approved plan.
            </div>
          ) : (
            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Run ID & Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Counts (Acc / Rej / Dup)</th>
                      <th className="py-3 px-4">Target Inserted</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {recentRuns.map((run) => (
                      <tr key={run._id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">
                            #{run._id.slice(-6)}
                          </div>
                          <span className="text-[10px] text-slate-500 tracking-wide font-sans">
                            {run.type === 'DRY_RUN' ? 'Deterministic Dry Run' : 'Actual Execution'} (v{run.planVersion})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400">{run.acceptedCount}</span> /{' '}
                          <span className="text-rose-400">{run.rejectedCount}</span> /{' '}
                          <span className="text-amber-400">{run.duplicateCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-200">{run.targetInsertedCount}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/runs/${run._id}`}
                            className="text-sky-400 hover:text-sky-300 font-sans text-xs underline font-medium"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Audit Activity Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Audit Stream
            </h2>
            <Link to="/history" className="text-xs text-sky-400 hover:underline">
              Full Timeline
            </Link>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4 max-h-[380px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log._id} className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-300 font-semibold text-[11px] truncate">
                        {log.event}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Actor: {log.actor}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Migration Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Legacy CRM to Enterprise Platform Migration"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Bounded scope migration of customer dataset..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Baseline Schema & Records Included:</p>
            <p>• Source: <code className="text-sky-300">legacy_customers</code> (customer_id, full_name, email_address, phone, created)</p>
            <p>• Target: <code className="text-emerald-300">customers</code> (customerId, name, email, phoneNumber, createdAt)</p>
            <p>• Supported Transformations: 11 bounded deterministic functions</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs transition"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
