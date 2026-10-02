import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  Save,
  Plus,
  Trash2,
  HelpCircle,
  RotateCw,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

const SUPPORTED_TRANSFORMATIONS = [
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
];

export const PlanReview = () => {
  const { id: projectId, planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state for editable mappings
  const [mappings, setMappings] = useState([]);
  const [risks, setRisks] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [changeNotes, setChangeNotes] = useState('');
  const [isModified, setIsModified] = useState(false);

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [approverName, setApproverName] = useState('Rahul Engineer');
  const [rejectorName, setRejectorName] = useState('Operator');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch plan
  const { data: planData, isLoading: isPlanLoading, error } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => api.getPlanById(planId),
  });

  // Fetch project
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProjectById(projectId),
  });

  const plan = planData?.data;
  const project = projectData?.data?.project;

  useEffect(() => {
    if (plan) {
      setMappings(plan.mappings || []);
      setRisks(plan.risks || []);
      setClarifications(plan.clarificationQuestions || []);
      setIsModified(false);
    }
  }, [plan]);

  // Save changes (creates a new version!)
  const updateMutation = useMutation({
    mutationFn: (payload) => api.updatePlan(planId, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['plan', res.data._id]);
      setIsModified(false);
      navigate(`/projects/${projectId}/plans/${res.data._id}`);
    },
  });

  // Approve plan
  const approveMutation = useMutation({
    mutationFn: () => api.approvePlan(planId, { approvedBy: approverName }),
    onSuccess: () => {
      queryClient.invalidateQueries(['plan', planId]);
      queryClient.invalidateQueries(['project', projectId]);
      setIsApproveModalOpen(false);
    },
  });

  // Reject plan
  const rejectMutation = useMutation({
    mutationFn: () => api.rejectPlan(planId, { rejectedBy: rejectorName, reason: rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['plan', planId]);
      queryClient.invalidateQueries(['project', projectId]);
      setIsRejectModalOpen(false);
    },
  });

  // Dry Run Mutation
  const dryRunMutation = useMutation({
    mutationFn: () => api.runDryRun(planId, approverName || 'OPERATOR'),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['project', projectId]);
      navigate(`/runs/${res.data.run._id}`);
    },
  });

  // Execution Mutation
  const executeMutation = useMutation({
    mutationFn: () => api.executeMigration(planId, approverName || 'OPERATOR'),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['project', projectId]);
      setIsExecuteModalOpen(false);
      navigate(`/runs/${res.data.run._id}`);
    },
  });

  const handleMappingChange = (index, field, value) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
    setIsModified(true);
  };

  const handleDeleteMapping = (index) => {
    const updated = mappings.filter((_, i) => i !== index);
    setMappings(updated);
    setIsModified(true);
  };

  const handleAddMapping = () => {
    const sourceFields = Object.keys(project?.sourceSchema?.fields || {});
    const targetFields = Object.keys(project?.targetSchema?.fields || {});
    const newMapping = {
      sourceField: sourceFields[0] || 'source_field',
      targetField: targetFields[0] || 'target_field',
      transformation: 'DIRECT',
      confidence: 1.0,
      reason: 'User added custom field mapping',
      transformationConfig: {},
    };
    setMappings([...mappings, newMapping]);
    setIsModified(true);
  };

  const handleToggleClarification = (id) => {
    const updated = clarifications.map((c) =>
      c.id === id ? { ...c, resolved: !c.resolved } : c
    );
    setClarifications(updated);
    setIsModified(true);
  };

  const handleSaveChanges = () => {
    updateMutation.mutate({
      mappings,
      risks,
      clarificationQuestions: clarifications,
      changeNotes: changeNotes.trim() || `User modifications on top of v${plan.version}`,
    });
  };

  if (isPlanLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading plan review workbench...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-white p-8 rounded-xl border border-rose-200 shadow-card text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Plan Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">{error?.message || 'Unable to retrieve plan.'}</p>
        <Link to={`/projects/${projectId}`} className="inline-flex px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition">
          Back to Project
        </Link>
      </div>
    );
  }

  const isApproved = plan.status === 'APPROVED';
  const isRejected = plan.status === 'REJECTED';
  const isExecuted = plan.status === 'EXECUTED';
  const isPendingReview = plan.status === 'PENDING_REVIEW' || plan.status === 'DRAFT';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Plan Status Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-800 transition-colors">
              {project?.name || 'Project'}
            </Link>
            <span>/</span>
            <span className="text-brand-600 font-mono font-medium">Plan v{plan.version}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              Migration Plan v{plan.version} Review
            </h1>
            <StatusBadge status={plan.status} />
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {plan.changeNotes || `Generated by ${plan.createdBy}`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Save modifications button */}
          {isModified && (
            <button
              onClick={handleSaveChanges}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? 'Saving...' : 'Save as New Version'}
            </button>
          )}

          {/* Gating: Approval Buttons */}
          {isPendingReview && (
            <>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                Reject Plan
              </button>

              <button
                onClick={() => setIsApproveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Approve Plan
              </button>
            </>
          )}

          {/* Dry Run Button */}
          <button
            onClick={() => dryRunMutation.mutate()}
            disabled={dryRunMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-sm transition"
          >
            {dryRunMutation.isPending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5 text-brand-600" />
            )}
            Run Dry Run
          </button>

          {/* Execute Migration Button */}
          <button
            onClick={() => setIsExecuteModalOpen(true)}
            disabled={!isApproved || executeMutation.isPending}
            title={!isApproved ? 'Only APPROVED plans can be executed.' : 'Execute migration'}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition shadow-sm ${
              isApproved
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-button cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {executeMutation.isPending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            Execute Approved Migration
          </button>
        </div>
      </div>

      {/* Section 34 & 35: Responsible AI Advisory Banner */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 shadow-subtle flex items-start gap-3 text-xs text-sky-900">
        <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-sky-800 text-[11px] tracking-wide uppercase">
            AI Advisory Notice — Verify Before Approval
          </p>
          <p className="text-sky-800/90 text-xs leading-relaxed">
            The AI proposes field mappings, compatibility checks, and risks. The AI cannot approve or execute database writes.
            All confidence scores represent <strong>AI suggested confidence</strong>, not guaranteed truth. Deterministic validation and reconciliation are enforced by the backend upon execution.
          </p>
        </div>
      </div>

      {/* Plan Status Warning if NOT Approved */}
      {!isApproved && !isExecuted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-subtle text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Gating Active:</strong> This plan is currently in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-mono font-medium">{plan.status}</code> state. It must be explicitly reviewed and approved by a human operator prior to execution.
            </span>
          </div>
          {isPendingReview && (
            <button
              onClick={() => setIsApproveModalOpen(true)}
              className="text-xs font-bold underline hover:text-amber-950 transition-colors shrink-0"
            >
              Approve Now
            </button>
          )}
        </div>
      )}

      {/* Section 11: Field Mappings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Proposed Field Mappings ({mappings.length})
            </h2>
            <p className="text-xs text-slate-500">
              Review and adjust mappings and transformations. Any edit creates a new version upon saving.
            </p>
          </div>

          <button
            onClick={handleAddMapping}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-300 shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600" />
            Add Mapping
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Source Field</th>
                <th className="py-3 px-4">Target Field</th>
                <th className="py-3 px-4">Transformation</th>
                <th className="py-3 px-4">AI Suggested Confidence</th>
                <th className="py-3 px-4">Reason / Mitigation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {mappings.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  {/* Source Field Input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={m.sourceField}
                      onChange={(e) => handleMappingChange(idx, 'sourceField', e.target.value)}
                      className="w-36 px-2 py-1 rounded bg-white border border-slate-300 text-brand-700 font-mono font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs shadow-subtle"
                    />
                  </td>

                  {/* Target Field Input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={m.targetField}
                      onChange={(e) => handleMappingChange(idx, 'targetField', e.target.value)}
                      className="w-36 px-2 py-1 rounded bg-white border border-slate-300 text-emerald-700 font-mono font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs shadow-subtle"
                    />
                  </td>

                  {/* Transformation Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={m.transformation}
                      onChange={(e) => handleMappingChange(idx, 'transformation', e.target.value)}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 font-mono focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs shadow-subtle"
                    >
                      {SUPPORTED_TRANSFORMATIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* AI Suggested Confidence Badge */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-800 font-bold">{(m.confidence * 100).toFixed(0)}%</span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            m.confidence >= 0.9
                              ? 'bg-emerald-500'
                              : m.confidence >= 0.7
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${m.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Reason Input */}
                  <td className="py-3 px-4 font-sans text-slate-600 text-xs">
                    <input
                      type="text"
                      value={m.reason || ''}
                      onChange={(e) => handleMappingChange(idx, 'reason', e.target.value)}
                      className="w-full min-w-[200px] px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 font-sans shadow-subtle"
                    />
                  </td>

                  {/* Delete Mapping */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteMapping(idx)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Remove mapping"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Risks & Clarification Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Risks Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Identified Compatibility Risks ({risks.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Evaluated by AI Agent</span>
          </div>

          {risks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No schema compatibility risks detected.</p>
          ) : (
            <div className="space-y-3">
              {risks.map((risk, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {risk.field ? `Field: ${risk.field}` : 'General Risk'}
                    </span>
                    <StatusBadge status={risk.level} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{risk.description}</p>
                  {risk.mitigation && (
                    <p className="text-[11px] text-brand-700 pt-1 border-t border-slate-200">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clarification Questions Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              Clarification Questions ({clarifications.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Human Guidance Requested</span>
          </div>

          {clarifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No unresolved questions flagged by AI agent.</p>
          ) : (
            <div className="space-y-3">
              {clarifications.map((cq) => (
                <div
                  key={cq.id}
                  className={`p-3 rounded-lg border transition ${
                    cq.resolved
                      ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-snug">{cq.question}</p>
                    <button
                      onClick={() => handleToggleClarification(cq.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono shrink-0 transition font-medium ${
                        cq.resolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cq.resolved ? 'Resolved' : 'Mark Resolved'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Category: {cq.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Migration Plan Steps */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-indigo-600" />
          Proposed Execution Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(plan.steps || []).map((step) => (
            <div key={step.order} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-mono font-bold inline-flex items-center justify-center text-[11px] border border-brand-200">
                {step.order}
              </span>
              <p className="font-bold text-slate-900 text-xs mt-1">{step.title}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Approve Migration Plan v${plan.version}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            By approving this plan, you certify that the field mappings, transformations, and identified risks have been reviewed.
            This action transitions the plan to <strong className="text-emerald-700 font-semibold">APPROVED</strong> status and unlocks migration execution.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approver Name / Operator ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsApproveModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || !approverName.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
            >
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Reject Migration Plan v${plan.version}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Rejecting this plan marks it as <strong className="text-rose-700 font-semibold">REJECTED</strong>. It cannot be executed.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejector Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rejectorName}
              onChange={(e) => setRejectorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this plan cannot be approved..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Execute Confirmation Modal */}
      <Modal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        title={`Execute Migration Plan v${plan.version}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You are about to execute migration plan <strong>v{plan.version}</strong> across <strong>{project?.sampleRecords?.length || 0}</strong> source records.
          </p>

          <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1">
            <p>• Valid records will be ingested idempotently into target store.</p>
            <p>• Invalid records will be routed into Quarantine with field-level evidence.</p>
            <p>• Deterministic reconciliation will run immediately after ingestion.</p>
            <p>• Selective rollback will be available if needed.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsExecuteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs shadow-button transition"
            >
              {executeMutation.isPending ? 'Executing...' : 'Start Execution'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
