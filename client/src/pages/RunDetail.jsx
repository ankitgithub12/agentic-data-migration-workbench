import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  RotateCw,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const RunDetail = () => {
  const { id: runId } = useParams();
  const queryClient = useQueryClient();
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [rollbackUser, setRollbackUser] = useState('Rahul Operator');

  const { data: runData, isLoading, error } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.getRunById(runId),
  });

  const rollbackMutation = useMutation({
    mutationFn: () => api.rollbackRun(runId, rollbackUser),
    onSuccess: () => {
      queryClient.invalidateQueries(['run', runId]);
      setIsRollbackModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading migration run diagnostics...</p>
      </div>
    );
  }

  if (error || !runData?.data) {
    return (
      <div className="bg-white p-8 rounded-xl border border-rose-200 shadow-card text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Run Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">{error?.message || 'Unable to retrieve run.'}</p>
        <Link to="/" className="inline-flex px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const run = runData.data;
  const isExecution = run.type === 'EXECUTION';
  const isDryRun = run.type === 'DRY_RUN';
  const isRolledBack = run.status === 'ROLLED_BACK';
  const isCompleted = run.status === 'COMPLETED';
  const canRollback = isExecution && !isRolledBack && (isCompleted || run.status === 'FAILED');

  const reconciliation = run.reconciliationDetails || {};
  const isReconciled = run.reconciliationStatus === 'PASSED';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to={`/projects/${run.projectId}`} className="hover:text-slate-800 transition-colors">Project</Link>
            <span>/</span>
            <span className="font-mono text-brand-600 font-medium">Run #{run._id.slice(-6)}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {isDryRun ? 'Deterministic Dry Run' : 'Migration Execution'} #{run._id.slice(-6)}
            </h1>
            <StatusBadge status={run.status} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
              Plan v{run.planVersion}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Started: {new Date(run.startedAt).toLocaleString()} • Completed: {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'In progress'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {run.rejectedCount > 0 && (
            <Link
              to={`/runs/${run._id}/quarantine`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shadow-subtle transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Inspect Quarantine ({run.rejectedCount} records)
            </Link>
          )}

          {canRollback && (
            <button
              onClick={() => setIsRollbackModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold shadow-subtle transition"
            >
              <RotateCcw className="w-4 h-4 text-purple-600" />
              Selective Rollback
            </button>
          )}

          {isRolledBack && (
            <div className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-medium">
              Rolled back on {new Date(run.rolledBackAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Source Records
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {run.sourceCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Transformed
          </span>
          <span className="text-2xl font-bold font-mono text-brand-600 mt-1 block">
            {run.transformedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Accepted
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
            {run.acceptedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Rejected
          </span>
          <span className="text-2xl font-bold font-mono text-rose-600 mt-1 block">
            {run.rejectedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Duplicates
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">
            {run.duplicateCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium block">
            Target Inserted
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-700 mt-1 block">
            {run.targetInsertedCount}
          </span>
        </div>
      </div>

      {/* Deterministic Reconciliation Card (Section 17) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {isReconciled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Deterministic Reconciliation Verification
              </h2>
              <p className="text-xs text-slate-500">
                Verifies exact counts without approximation. Discrepancies fail reconciliation.
              </p>
            </div>
          </div>
          <StatusBadge status={run.reconciliationStatus} />
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
          <p className="text-slate-800">
            <strong>Summary:</strong> {reconciliation.summary || 'Reconciliation check performed.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-200">
            <div>
              Invariant 1: Source ({run.sourceCount}) = Accepted ({run.acceptedCount}) + Rejected ({run.rejectedCount})
              <span className="text-emerald-700 ml-2 font-bold">
                {run.sourceCount === run.acceptedCount + run.rejectedCount ? '✓ OK' : '✗ MISMATCH'}
              </span>
            </div>
            <div>
              Invariant 2: Expected Target = Accepted ({run.acceptedCount}) - Duplicates ({run.duplicateCount})
              <span className="text-emerald-700 ml-2 font-bold">
                {isDryRun || run.targetInsertedCount === run.acceptedCount - run.duplicateCount ? '✓ OK' : '✗ DISCREPANCY'}
              </span>
            </div>
          </div>
        </div>

        {/* If reconciliation failed, show issues */}
        {reconciliation.issues?.length > 0 && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <p className="font-bold text-rose-900">Reconciliation Discrepancies Detected:</p>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
              {reconciliation.issues.map((iss, idx) => (
                <li key={idx}>{iss}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quarantined Records Quick Access */}
      {run.rejectedCount > 0 && (
        <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {run.rejectedCount} Records Isolated in Quarantine
              </h3>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Records containing malformed formats or missing required fields did not enter the target store.
              </p>
            </div>
          </div>

          <Link
            to={`/runs/${run._id}/quarantine`}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition"
          >
            Review Rejected Records
          </Link>
        </div>
      )}

      {/* Selective Rollback Modal (Section 18) */}
      <Modal
        isOpen={isRollbackModalOpen}
        onClose={() => setIsRollbackModalOpen(false)}
        title="Confirm Selective Rollback"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Selective Rollback Safety Rules:
            </div>
            <p>
              • This operation will remove <strong>{run.targetInsertedCount}</strong> records inserted by this specific migration run.
            </p>
            <p>
              • Pre-existing records or records from other migration runs will NOT be touched.
            </p>
            <p>
              • Repeated rollback on this run will be strictly prevented.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operator Name / Sign-off <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rollbackUser}
              onChange={(e) => setRollbackUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsRollbackModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => rollbackMutation.mutate()}
              disabled={rollbackMutation.isPending}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
            >
              {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
