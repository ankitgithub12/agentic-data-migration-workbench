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
      // Navigate to newly created version
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
        <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading plan review workbench...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-rose-900/50 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-100">Plan Not Found</h3>
        <p className="text-sm text-slate-400 mt-1 mb-4">{error?.message || 'Unable to retrieve plan.'}</p>
        <Link to={`/projects/${projectId}`} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-200">
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
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-slate-200">Dashboard</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-200">
              {project?.name || 'Project'}
            </Link>
            <span>/</span>
            <span className="text-sky-400 font-mono">Plan v{plan.version}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              Migration Plan v{plan.version} Review
            </h1>
            <StatusBadge status={plan.status} />
          </div>

          <p className="text-xs text-slate-400 mt-1">
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition shadow-md shadow-amber-600/20"
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-medium text-xs transition"
              >
                <XCircle className="w-4 h-4" />
                Reject Plan
              </button>

              <button
                onClick={() => setIsApproveModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/20"
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition"
          >
            {dryRunMutation.isPending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
            )}
            Run Dry Run
          </button>

          {/* Execute Migration Button */}
          <button
            onClick={() => setIsExecuteModalOpen(true)}
            disabled={!isApproved || executeMutation.isPending}
            title={!isApproved ? 'Only APPROVED plans can be executed.' : 'Execute migration'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs transition shadow-lg ${
              isApproved
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
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
      <div className="glass-panel p-4 rounded-xl border border-sky-800/40 bg-sky-950/20 flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-sky-300">
            AI Advisory Notice — Verify Before Approval
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The AI proposes field mappings, compatibility checks, and risks. The AI cannot approve or execute database writes.
            All confidence scores represent <strong>AI suggested confidence</strong>, not guaranteed truth. Deterministic validation and reconciliation are enforced by the backend upon execution.
          </p>
        </div>
      </div>

      {/* Plan Status Warning if NOT Approved */}
      {!isApproved && !isExecuted && (
        <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Gating Active:</strong> This plan is currently in <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200 font-mono">{plan.status}</code> state. It must be explicitly reviewed and approved by a human operator prior to execution.
            </span>
          </div>
          {isPendingReview && (
            <button
              onClick={() => setIsApproveModalOpen(true)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Approve Now
            </button>
          )}
        </div>
      )}

      {/* Section 11: Field Mappings Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Proposed Field Mappings ({mappings.length})
            </h2>
            <p className="text-xs text-slate-400">
              Review and adjust mappings and transformations. Any edit creates a new version upon saving.
            </p>
          </div>

          <button
            onClick={handleAddMapping}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            Add Mapping
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Source Field</th>
                <th className="py-3 px-4">Target Field</th>
                <th className="py-3 px-4">Transformation</th>
                <th className="py-3 px-4">AI Suggested Confidence</th>
                <th className="py-3 px-4">Reason / Mitigation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {mappings.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 transition">
                  {/* Source Field Input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={m.sourceField}
                      onChange={(e) => handleMappingChange(idx, 'sourceField', e.target.value)}
                      className="w-36 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Target Field Input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={m.targetField}
                      onChange={(e) => handleMappingChange(idx, 'targetField', e.target.value)}
                      className="w-36 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Transformation Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={m.transformation}
                      onChange={(e) => handleMappingChange(idx, 'transformation', e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
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
                      <span className="text-slate-200">{(m.confidence * 100).toFixed(0)}%</span>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            m.confidence >= 0.9
                              ? 'bg-emerald-400'
                              : m.confidence >= 0.7
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${m.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Reason Input */}
                  <td className="py-3 px-4 font-sans text-slate-400 text-xs">
                    <input
                      type="text"
                      value={m.reason || ''}
                      onChange={(e) => handleMappingChange(idx, 'reason', e.target.value)}
                      className="w-full min-w-[200px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-sky-500 focus:outline-none font-sans"
                    />
                  </td>

                  {/* Delete Mapping */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteMapping(idx)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
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
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Identified Compatibility Risks ({risks.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Evaluated by AI Agent</span>
          </div>

          {risks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No schema compatibility risks detected.</p>
          ) : (
            <div className="space-y-3">
              {risks.map((risk, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {risk.field ? `Field: ${risk.field}` : 'General Risk'}
                    </span>
                    <StatusBadge status={risk.level} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{risk.description}</p>
                  {risk.mitigation && (
                    <p className="text-[11px] text-sky-400/90 pt-1 border-t border-slate-800/50">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clarification Questions Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
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
                      ? 'bg-slate-900/30 border-slate-800 text-slate-500'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium leading-snug">{cq.question}</p>
                    <button
                      onClick={() => handleToggleClarification(cq.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 transition ${
                        cq.resolved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
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
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-indigo-400" />
          Proposed Execution Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(plan.steps || []).map((step) => (
            <div key={step.order} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-mono font-bold inline-flex items-center justify-center text-[10px]">
                {step.order}
              </span>
              <p className="font-semibold text-slate-200 text-xs mt-1">{step.title}</p>
              <p className="text-[11px] text-slate-400 leading-snug">{step.description}</p>
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
          <p className="text-xs text-slate-300 leading-relaxed">
            By approving this plan, you certify that the field mappings, transformations, and identified risks have been reviewed.
            This action transitions the plan to <strong className="text-emerald-400">APPROVED</strong> status and unlocks migration execution.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Approver Name / Operator ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsApproveModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || !approverName.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition"
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
          <p className="text-xs text-slate-300 leading-relaxed">
            Rejecting this plan marks it as <strong className="text-rose-400">REJECTED</strong>. It cannot be executed.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rejector Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={rejectorName}
              onChange={(e) => setRejectorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reason for Rejection <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this plan cannot be approved..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs transition"
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
          <p className="text-xs text-slate-300 leading-relaxed">
            You are about to execute migration plan <strong>v{plan.version}</strong> across <strong>{project?.sampleRecords?.length || 0}</strong> source records.
          </p>

          <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/40 text-xs text-slate-300 space-y-1">
            <p>• Valid records will be ingested idempotently into target store.</p>
            <p>• Invalid records will be routed into Quarantine with field-level evidence.</p>
            <p>• Deterministic reconciliation will run immediately after ingestion.</p>
            <p>• Selective rollback will be available if needed.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsExecuteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs transition"
            >
              {executeMutation.isPending ? 'Executing...' : 'Start Execution'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
