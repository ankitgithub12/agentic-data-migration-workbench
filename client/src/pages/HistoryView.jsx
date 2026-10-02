import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';

const eventIcons = {
  PROJECT_CREATED: Sparkles,
  PLAN_CREATED: Sparkles,
  PLAN_EDITED: Activity,
  PLAN_APPROVED: ShieldCheck,
  PLAN_REJECTED: AlertTriangle,
  DRY_RUN_STARTED: PlayCircle,
  DRY_RUN_COMPLETED: CheckCircle2,
  MIGRATION_STARTED: PlayCircle,
  MIGRATION_COMPLETED: CheckCircle2,
  MIGRATION_FAILED: AlertTriangle,
  MIGRATION_ROLLED_BACK: RotateCcw,
};

const eventColors = {
  PROJECT_CREATED: 'text-sky-400 bg-sky-950/60 border-sky-800',
  PLAN_CREATED: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
  PLAN_EDITED: 'text-amber-400 bg-amber-950/60 border-amber-800',
  PLAN_APPROVED: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
  PLAN_REJECTED: 'text-rose-400 bg-rose-950/60 border-rose-800',
  DRY_RUN_STARTED: 'text-sky-400 bg-sky-950/60 border-sky-800',
  DRY_RUN_COMPLETED: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
  MIGRATION_STARTED: 'text-blue-400 bg-blue-950/60 border-blue-800',
  MIGRATION_COMPLETED: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
  MIGRATION_FAILED: 'text-rose-400 bg-rose-950/60 border-rose-800',
  MIGRATION_ROLLED_BACK: 'text-purple-400 bg-purple-950/60 border-purple-800',
};

export const HistoryView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
  });

  const logs = data?.data?.recentActivity || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading audit history timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link to="/" className="hover:text-slate-200">Dashboard</Link>
          <span>/</span>
          <span className="text-sky-400 font-medium">Audit History</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
          <History className="w-6 h-6 text-sky-400" />
          Audit Timeline & Governance Log
        </h1>

        <p className="text-xs text-slate-400 mt-1">
          Immutable event log tracking AI proposals, human approvals, deterministic dry runs, migrations, and rollbacks.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center border border-dashed border-slate-800 text-slate-500 text-sm">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {logs.map((log) => {
            const Icon = eventIcons[log.event] || Activity;
            const style = eventColors[log.event] || 'text-slate-400 bg-slate-900 border-slate-800';

            return (
              <div key={log._id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[31px] top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-md ${style}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content Box */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 glass-panel-hover space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-mono text-sm font-semibold text-slate-200">
                      {log.event}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Triggered by: <span className="font-mono text-slate-300 font-medium">{log.actor}</span>
                  </p>

                  {/* Metadata preview */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 font-mono text-[11px] text-slate-400 space-y-0.5">
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-300">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
