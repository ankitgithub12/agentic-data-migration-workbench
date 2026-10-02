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
        <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading migration run diagnostics...</p>
      </div>
    );
  }

  if (error || !runData?.data) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-rose-900/50 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-100">Run Not Found</h3>
        <p className="text-sm text-slate-400 mt-1 mb-4">{error?.message || 'Unable to retrieve run.'}</p>
        <Link to="/" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-200">
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
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-slate-200">Dashboard</Link>
            <span>/</span>
            <Link to={`/projects/${run.projectId}`} className="hover:text-slate-200">Project</Link>
            <span>/</span>
            <span className="font-mono text-sky-400">Run #{run._id.slice(-6)}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {isDryRun ? 'Deterministic Dry Run' : 'Migration Execution'} #{run._id.slice(-6)}
            </h1>
            <StatusBadge status={run.status} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Plan v{run.planVersion}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Started: {new Date(run.startedAt).toLocaleString()} • Completed: {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'In progress'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {run.rejectedCount > 0 && (
            <Link
              to={`/runs/${run._id}/quarantine`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-medium transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Inspect Quarantine ({run.rejectedCount} records)
            </Link>
          )}

          {canRollback && (
            <button
              onClick={() => setIsRollbackModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-medium transition"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              Selective Rollback
            </button>
          )}

          {isRolledBack && (
            <div className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-mono">
              Rolled back on {new Date(run.rolledBackAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Source Records
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
            {run.sourceCount}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Transformed
          </span>
          <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {run.transformedCount}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Accepted
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {run.acceptedCount}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Rejected
          </span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {run.rejectedCount}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Duplicates
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {run.duplicateCount}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
            Target Inserted
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-300 mt-1 block">
            {run.targetInsertedCount}
          </span>
        </div>
      </div>

      {/* Deterministic Reconciliation Card (Section 17) */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {isReconciled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Deterministic Reconciliation Verification
              </h2>
              <p className="text-xs text-slate-400">
                Verifies exact counts without approximation. Discrepancies fail reconciliation.
              </p>
            </div>
          </div>
          <StatusBadge status={run.reconciliationStatus} />
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs space-y-2">
          <p className="text-slate-300">
            <strong>Summary:</strong> {reconciliation.summary || 'Reconciliation check performed.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
            <div>
              Invariant 1: Source ({run.sourceCount}) = Accepted ({run.acceptedCount}) + Rejected ({run.rejectedCount})
              <span className="text-emerald-400 ml-2 font-bold">
                {run.sourceCount === run.acceptedCount + run.rejectedCount ? '✓ OK' : '✗ MISMATCH'}
              </span>
            </div>
            <div>
              Invariant 2: Expected Target = Accepted ({run.acceptedCount}) - Duplicates ({run.duplicateCount})
              <span className="text-emerald-400 ml-2 font-bold">
                {isDryRun || run.targetInsertedCount === run.acceptedCount - run.duplicateCount ? '✓ OK' : '✗ DISCREPANCY'}
              </span>
            </div>
          </div>
        </div>

        {/* If reconciliation failed, show issues */}
        {reconciliation.issues?.length > 0 && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-1">
            <p className="font-semibold text-rose-200">Reconciliation Discrepancies Detected:</p>
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
        <div className="glass-panel p-5 rounded-xl border border-amber-900/40 bg-amber-950/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {run.rejectedCount} Records Isolated in Quarantine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Records containing malformed formats or missing required fields did not enter the target store.
              </p>
            </div>
          </div>

          <Link
            to={`/runs/${run._id}/quarantine`}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition"
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
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operator Name / Sign-off <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={rollbackUser}
              onChange={(e) => setRollbackUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsRollbackModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => rollbackMutation.mutate()}
              disabled={rollbackMutation.isPending}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs transition"
            >
              {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
