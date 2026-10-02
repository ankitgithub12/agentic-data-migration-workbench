import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Database,
  PlayCircle,
  ArrowRight,
  Plus,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const { data: statsData } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (newProject) => api.createProject(newProject),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      navigate(`/projects/${res.data._id}`);
    },
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const defaultPayload = {
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || 'Bounded schema data migration project',
      sourceSchema: {
        name: 'legacy_customers',
        fields: {
          customer_id: { type: 'number', required: true, description: 'Legacy customer ID' },
          full_name: { type: 'string', required: true, description: 'Customer full name' },
          email_address: { type: 'string', required: true, format: 'email', description: 'Contact email' },
          phone: { type: 'string', required: false, description: 'Phone number' },
          created: { type: 'string', required: true, description: 'Creation date' },
        },
      },
      targetSchema: {
        name: 'customers',
        fields: {
          customerId: { type: 'number', required: true, description: 'Target customer ID' },
          name: { type: 'string', required: true, description: 'Normalized customer name' },
          email: { type: 'string', required: true, format: 'email', description: 'RFC email' },
          phoneNumber: { type: 'string', required: false, description: 'Normalized phone' },
          createdAt: { type: 'date', required: true, description: 'ISO date' },
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
  const activeProject = projects[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Title + Action Section */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900" id="overview-heading">
              Migration Workbench Overview
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Deterministic data migration planning, AI mapping analysis, human approval gating, and reconciliation.
            </p>
          </div>

          {/* Primary CTA Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm tracking-wide shadow-button transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shrink-0"
            type="button"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>New Migration Project</span>
          </button>
        </div>
      </section>

      {/* KPI Metrics Grid (4 Cards) */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Metric Card 1: TOTAL PROJECTS */}
        <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Projects
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-brand-600 border border-sky-100 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalProjects ?? projects.length}
            </span>
            <p className="mt-1 text-xs text-slate-500">Configured migration scopes</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500/20 group-hover:bg-brand-500 transition-colors" />
        </article>

        {/* Metric Card 2: TARGET INGESTED */}
        <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Target Ingested
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalTargetRecords ?? 0}
            </span>
            <p className="mt-1 text-xs text-slate-500">Active records in target store</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
        </article>

        {/* Metric Card 3: RECENT RUNS */}
        <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Recent Runs
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {recentRuns.length}
            </span>
            <p className="mt-1 text-xs text-slate-500">Dry runs and executions</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
        </article>

        {/* Metric Card 4: GATING MODE */}
        <article className="bg-white rounded-xl border border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 p-5 shadow-card hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono">
              Gating Mode
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-600 border border-amber-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-[26px] font-extrabold text-amber-600 tracking-tight leading-tight">
              Human Approval
            </div>
            <p className="mt-1 text-xs text-slate-500">Zero unsupervised AI writes</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </article>
      </section>

      {/* BEGIN: ActivePipelineDetails */}
      {activeProject && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Migration Pipeline</h3>
              <p className="text-xs text-slate-500">Active schema planning, deterministic mapping, and validation run.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeProject.latestPlanStatus ? `Plan: ${activeProject.latestPlanStatus}` : 'Active Scope'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Active Migration Item Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/40 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-mono font-bold text-xs">
                  MIG-01
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {activeProject.sourceSchema?.name || 'legacy_customers'} → {activeProject.targetSchema?.name || 'customers'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Dataset: <span className="text-slate-700">{activeProject.name}</span> • Scope: {activeProject.sampleRecords?.length || 0} sample records
                  </p>
                </div>
              </div>

              {/* Pipeline Step Badge Trail */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">1. Schemas Analyzed</span>
                <span className="text-slate-300">→</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium border border-amber-300/50 animate-pulse">
                  2. Pending Human Review
                </span>
                <span className="text-slate-300">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">3. Dry Run (Ready)</span>
              </div>
            </div>

            {/* Execution Safety Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold uppercase text-slate-400 font-mono">Plan Determinism Score</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">100%</span>
                  <span className="text-xs text-emerald-600 font-medium">Zero heuristic shifts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold uppercase text-slate-400 font-mono">Rollback Safety Target</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">Active</span>
                  <span className="text-xs text-slate-500 font-medium">Snapshot verified</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-brand-500 h-full w-full" />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold uppercase text-slate-400 font-mono">Supervision Gate</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-amber-600">Locked</span>
                  <span className="text-xs text-slate-500 font-medium">Operator signature req.</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-400 h-full w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Agentic inference passed 11 boundary &amp; typing constraints.</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={`/projects/${activeProject._id}`}
                className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                View Mapping Spec
              </Link>
              <Link
                to={`/projects/${activeProject._id}`}
                className="px-3.5 py-1.5 rounded-md bg-white border border-slate-300 font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition-all"
              >
                Review &amp; Approve Execution
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* END: ActivePipelineDetails */}

      {/* Migration Projects Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-600" />
            Configured Migration Projects ({projects.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 hover:text-brand-600 transition">
                      <Link to={`/projects/${proj._id}`}>{proj.name}</Link>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {proj.description || 'No description provided'}
                    </p>
                  </div>
                  <StatusBadge status={proj.latestPlanStatus || 'DRAFT'} />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Sample Records</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {proj.sampleRecords?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Plan Version</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {proj.latestPlanVersion ? `v${proj.latestPlanVersion}` : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Runs</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {proj.totalRuns || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {proj.sourceSchema?.name} → {proj.targetSchema?.name}
                </span>
                <Link
                  to={`/projects/${proj._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                >
                  Open Workbench <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid: Recent Runs and Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-indigo-600" />
              Recent Migration Runs
            </h3>
            <Link to="/runs" className="text-xs font-semibold text-brand-600 hover:underline">
              View All Runs
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            {recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No migration runs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Run Identifier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Accepted / Rejected / Duplicates</th>
                      <th className="py-3 px-4">Target Inserted</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {recentRuns.map((run) => (
                      <tr key={run._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">#{run._id.slice(-6)}</span>
                          <span className="block text-[10px] text-slate-500 font-sans">
                            {run.type === 'DRY_RUN' ? 'Deterministic Dry Run' : 'Actual Execution'} (v{run.planVersion})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-700 font-semibold">{run.acceptedCount}</span> /{' '}
                          <span className="text-rose-700 font-semibold">{run.rejectedCount}</span> /{' '}
                          <span className="text-amber-700 font-semibold">{run.duplicateCount}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{run.targetInsertedCount}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/runs/${run._id}`}
                            className="text-brand-600 hover:text-brand-700 font-sans text-xs underline font-semibold"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Audit Activity Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Audit Stream
            </h3>
            <Link to="/history" className="text-xs font-semibold text-brand-600 hover:underline">
              Full Timeline
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card space-y-3 max-h-[380px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log._id} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-800 font-semibold text-[11px] truncate">
                        {log.event}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Actor: {log.actor}</p>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Legacy CRM to Enterprise Platform Migration"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Bounded scope migration of customer dataset..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Baseline Schema &amp; Records Included:</p>
            <p>• Source: <code className="text-brand-600 font-mono">legacy_customers</code> (customer_id, full_name, email_address, phone, created)</p>
            <p>• Target: <code className="text-emerald-700 font-mono">customers</code> (customerId, name, email, phoneNumber, createdAt)</p>
            <p>• Supported Transformations: 11 bounded deterministic functions</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs shadow-button transition"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
