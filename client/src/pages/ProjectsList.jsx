import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Database,
  ArrowRight,
  Plus,
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const ProjectsList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const { data: projectsData, isLoading } = useQuery({
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

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sourceSchema?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.targetSchema?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.latestPlanStatus !== 'REJECTED') ||
      p.latestPlanStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSampleRecords = projects.reduce((acc, p) => acc + (p.sampleRecords?.length || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading migration projects catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-brand-600 font-medium font-mono">Migration Projects</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FolderGit2 className="w-7 h-7 text-brand-600" />
              Migration Projects
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
              Define and manage bounded schema migration scopes, review source &amp; target contracts, and configure deterministic transformation registries.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-button transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>New Migration Project</span>
          </button>
        </div>
      </div>

      {/* Scope Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Configured Projects
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {projects.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Isolated migration boundaries</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Bounded Ingestion Scope
          </span>
          <span className="text-2xl font-extrabold text-brand-600 mt-1 block font-mono">
            {totalSampleRecords} records
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Pre-loaded validation dataset</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Bounded Functions
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block font-mono">
            11 Built-in
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Deterministic registry (No eval)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Governance Standard
          </span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
            Strict Gated
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Human sign-off mandatory</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, schemas, or descriptions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          {['ALL', 'ACTIVE', 'APPROVED', 'DRAFT'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition font-medium ${
                statusFilter === s
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Catalog Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300 shadow-card">
          <FolderGit2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No migration projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No projects match your current search or filter criteria.'
              : 'Get started by creating your first bounded dataset migration scope.'}
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-button transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const sourceFields = Object.keys(project.sourceSchema?.fields || {});
            const targetFields = Object.keys(project.targetSchema?.fields || {});

            return (
              <div
                key={project._id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-mono font-bold text-xs">
                        MIG
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition">
                          <Link to={`/projects/${project._id}`}>{project.name}</Link>
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          ID: #{project._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={project.latestPlanStatus || 'DRAFT'} />
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {project.description || 'Deterministic bounded schema data migration project'}
                  </p>

                  {/* Schema Mapping Path Strip */}
                  <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Source Schema</span>
                      <span className="font-bold text-brand-700">{project.sourceSchema?.name}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">{sourceFields.length} fields</span>
                    </div>

                    <div className="text-slate-400 font-bold px-2">→</div>

                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Target Schema</span>
                      <span className="font-bold text-emerald-700">{project.targetSchema?.name}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">{targetFields.length} fields</span>
                    </div>
                  </div>

                  {/* Field Tags Preview */}
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1">Source Contract:</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {sourceFields.map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-500">
                    Scope: <strong className="text-slate-800">{project.sampleRecords?.length || 0}</strong> records
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition border border-slate-200"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Migration Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Initializes an isolated migration boundary with pre-configured schemas (<code className="text-brand-700 font-mono">legacy_customers</code> $\to$ <code className="text-emerald-700 font-mono">customers</code>) and deterministic transformation rules.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g., E-Commerce User Migration Q4"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm"
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
              placeholder="Explain the scope and purpose of this migration..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !newProjectName.trim()}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs shadow-button transition"
            >
              {createMutation.isPending ? 'Creating...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
