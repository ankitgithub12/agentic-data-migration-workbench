import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  Database,
  FileSpreadsheet,
  Layers,
  CheckCircle,
  AlertTriangle,
  History,
  Clock,
  PlayCircle,
  ShieldCheck,
  RotateCw,
  Search,
  Code2,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';

const AI_LOADING_STEPS = [
  'Analyzing source and target schemas...',
  'Evaluating semantic field similarities...',
  'Validating bounded transformations...',
  'Checking compatibility and detecting risks...',
  'Preparing structured migration plan...',
];

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('schemas'); // 'schemas' | 'samples' | 'plans' | 'runs'
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProjectById(id),
  });

  const aiAnalyzeMutation = useMutation({
    mutationFn: () => {
      // Simulate step progression during analysis
      let step = 0;
      const interval = setInterval(() => {
        step = (step + 1) % AI_LOADING_STEPS.length;
        setLoadingStepIdx(step);
      }, 700);

      return api.runAIAnalysis(id).finally(() => clearInterval(interval));
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['project', id]);
      // Navigate straight to the newly created plan review page!
      navigate(`/projects/${id}/plans/${res.data._id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading project configuration...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-rose-900/50 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-100">Project Not Found</h3>
        <p className="text-sm text-slate-400 mt-1 mb-4">{error?.message || 'Unable to retrieve project.'}</p>
        <Link to="/" className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { project, plans = [], runs = [] } = data.data;
  const sourceFields = Object.entries(project.sourceSchema?.fields || {});
  const targetFields = Object.entries(project.targetSchema?.fields || {});
  const sampleRecords = project.sampleRecords || [];

  // Filter sample records
  const filteredRecords = sampleRecords.filter((rec) =>
    JSON.stringify(rec).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-slate-200">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">Projects</span>
            <span>/</span>
            <span className="font-mono text-sky-400">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            {project.name}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {project.status}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {project.description || 'Deterministic data migration project'}
          </p>
        </div>

        {/* Primary AI Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => aiAnalyzeMutation.mutate()}
            disabled={aiAnalyzeMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition shadow-lg shadow-sky-600/20"
          >
            {aiAnalyzeMutation.isPending ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Schemas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Run AI Analysis & Generate Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic AI Loading State (Section 39) */}
      {aiAnalyzeMutation.isPending && (
        <div className="glass-panel p-6 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-4 animate-subtle-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 animate-spin" />
              <h3 className="text-sm font-semibold text-sky-300">
                AI Agent Analyzing Migration Inputs...
              </h3>
            </div>
            <span className="text-xs font-mono text-sky-400">
              Step {loadingStepIdx + 1} of {AI_LOADING_STEPS.length}
            </span>
          </div>

          <p className="text-xs font-mono text-slate-300 pl-8">
            &gt; {AI_LOADING_STEPS[loadingStepIdx]}
          </p>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-1.5 transition-all duration-500"
              style={{ width: `${((loadingStepIdx + 1) / AI_LOADING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Failure Error UX (Section 40) */}
      {aiAnalyzeMutation.isError && (
        <div className="glass-panel p-5 rounded-xl border border-rose-900 bg-rose-950/30 text-rose-200 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            AI Analysis Failed — Migration Has NOT Been Executed
          </div>
          <p className="text-xs text-rose-300 leading-relaxed font-mono">
            Reason: {aiAnalyzeMutation.error?.message || 'Unable to generate a valid structured response.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => aiAnalyzeMutation.mutate()}
              className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-xs font-medium text-white transition"
            >
              Retry AI Analysis
            </button>
          </div>
        </div>
      )}

      {/* Quick Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-xs block">Source Schema</span>
          <span className="font-mono text-sm font-semibold text-sky-300">
            {project.sourceSchema?.name}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">{sourceFields.length} fields</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-xs block">Target Schema</span>
          <span className="font-mono text-sm font-semibold text-emerald-300">
            {project.targetSchema?.name}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">{targetFields.length} fields</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-xs block">Sample Records</span>
          <span className="font-mono text-sm font-semibold text-slate-200">
            {sampleRecords.length} records
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Max bound: 1,000</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-xs block">Plan Versions</span>
          <span className="font-mono text-sm font-semibold text-indigo-300">
            {plans.length} {plans.length === 1 ? 'version' : 'versions'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Latest: {plans[0] ? `v${plans[0].version} (${plans[0].status})` : 'None'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab('schemas')}
          className={`pb-3 font-medium transition flex items-center gap-2 relative ${
            activeTab === 'schemas'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Source & Target Schemas
        </button>

        <button
          onClick={() => setActiveTab('samples')}
          className={`pb-3 font-medium transition flex items-center gap-2 relative ${
            activeTab === 'samples'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Sample Records ({sampleRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 font-medium transition flex items-center gap-2 relative ${
            activeTab === 'plans'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Migration Plans ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('runs')}
          className={`pb-3 font-medium transition flex items-center gap-2 relative ${
            activeTab === 'runs'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          Executions ({runs.length})
        </button>
      </div>

      {/* Tab 1: Source & Target Schemas */}
      {activeTab === 'schemas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Schema Box */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-sm text-sky-400">
                  <Database className="w-4 h-4" />
                  Source Schema: <code className="text-slate-200">{project.sourceSchema?.name}</code>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Legacy Ingestion</span>
              </div>

              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {sourceFields.map(([field, def]) => (
                  <div key={field} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-200">{field}</span>
                      {def.description && (
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">{def.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {def.type}
                      </span>
                      {def.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                          required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Schema Box */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                  <Database className="w-4 h-4" />
                  Target Schema: <code className="text-slate-200">{project.targetSchema?.name}</code>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Enterprise Destination</span>
              </div>

              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {targetFields.map(([field, def]) => (
                  <div key={field} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-200">{field}</span>
                      {def.description && (
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">{def.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {def.type}
                      </span>
                      {def.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supported Transformations Badge Cloud */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Deterministic Transformation Registry (Section 6)
            </h3>
            <p className="text-xs text-slate-500">
              Only documented bounded functions are permitted. Arbitrary AI code execution is prohibited.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
              {(project.supportedTransformations || []).map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sample Records */}
      {activeTab === 'samples' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sample records..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredRecords.length} of {sampleRecords.length} records
            </span>
          </div>

          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    {sourceFields.map(([field]) => (
                      <th key={field} className="py-2.5 px-3">{field}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.slice(0, 50).map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      {sourceFields.map(([field]) => (
                        <td key={field} className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {rec[field] !== undefined ? String(rec[field]) : <span className="text-slate-600">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Migration Plans (Versioned) */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">
              Versioned Migration Plans
            </h3>
            <span className="text-xs text-slate-500">
              Every edit generates a distinct historical version
            </span>
          </div>

          {plans.length === 0 ? (
            <div className="glass-panel p-10 rounded-xl text-center border border-dashed border-slate-800">
              <Sparkles className="w-10 h-10 text-sky-400/50 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">No migration plans generated yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Run AI analysis to propose field mappings, detect compatibility risks, and draft plan version 1.
              </p>
              <button
                onClick={() => aiAnalyzeMutation.mutate()}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition"
              >
                Generate Plan v1 with AI
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className="glass-panel p-5 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-hover"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-sky-400">
                        Plan Version {p.version}
                      </span>
                      <StatusBadge status={p.status} />
                      <span className="text-[11px] text-slate-500 font-mono">
                        {p.mappings?.length || 0} mapped fields
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {p.changeNotes || 'Initial plan version'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                      <span>Created by: {p.createdBy}</span>
                      {p.approvedBy && (
                        <span className="text-emerald-400">
                          Approved by: {p.approvedBy} ({new Date(p.approvedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/projects/${project._id}/plans/${p._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition shrink-0"
                  >
                    Open Review Workbench <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Executions & Runs */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          {runs.length === 0 ? (
            <div className="glass-panel p-10 rounded-xl text-center border border-slate-800 text-sm text-slate-500">
              No executions or dry runs yet for this project.
            </div>
          ) : (
            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Run ID & Type</th>
                    <th className="py-3 px-4">Plan Version</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Accepted / Rejected / Duplicates</th>
                    <th className="py-3 px-4">Target Inserted</th>
                    <th className="py-3 px-4">Reconciliation</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {runs.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-200">#{r._id.slice(-6)}</span>
                        <span className="block text-[10px] text-slate-500 font-sans">{r.type}</span>
                      </td>
                      <td className="py-3 px-4">v{r.planVersion}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400">{r.acceptedCount}</span> /{' '}
                        <span className="text-rose-400">{r.rejectedCount}</span> /{' '}
                        <span className="text-amber-400">{r.duplicateCount}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{r.targetInsertedCount}</td>
                      <td className="py-3 px-4">
                        <span className={r.reconciliationStatus === 'PASSED' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                          {r.reconciliationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/runs/${r._id}`}
                          className="text-sky-400 hover:text-sky-300 font-sans text-xs underline font-medium"
                        >
                          Inspect Run
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
