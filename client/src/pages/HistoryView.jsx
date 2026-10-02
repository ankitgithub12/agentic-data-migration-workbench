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
  PROJECT_CREATED: 'text-sky-700 bg-sky-50 border-sky-200',
  PLAN_CREATED: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  PLAN_EDITED: 'text-amber-700 bg-amber-50 border-amber-200',
  PLAN_APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  PLAN_REJECTED: 'text-rose-700 bg-rose-50 border-rose-200',
  DRY_RUN_STARTED: 'text-sky-700 bg-sky-50 border-sky-200',
  DRY_RUN_COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  MIGRATION_STARTED: 'text-blue-700 bg-blue-50 border-blue-200',
  MIGRATION_COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  MIGRATION_FAILED: 'text-rose-700 bg-rose-50 border-rose-200',
  MIGRATION_ROLLED_BACK: 'text-purple-700 bg-purple-50 border-purple-200',
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
        <RotateCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading audit history timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-brand-600 font-medium">Audit History</span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <History className="w-6 h-6 text-brand-600" />
          Audit Timeline &amp; Governance Log
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Immutable event log tracking AI proposals, human approvals, deterministic dry runs, migrations, and rollbacks.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300 shadow-card text-slate-500 text-sm">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {logs.map((log) => {
            const Icon = eventIcons[log.event] || Activity;
            const style = eventColors[log.event] || 'text-slate-600 bg-slate-50 border-slate-200';

            return (
              <div key={log._id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[31px] top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm ${style}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card hover:shadow-md transition-shadow space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {log.event}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Triggered by: <span className="font-mono text-slate-900 font-semibold">{log.actor}</span>
                  </p>

                  {/* Metadata preview */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-slate-500 font-semibold">{k}:</span>
                          <span className="text-slate-800">{JSON.stringify(v)}</span>
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
