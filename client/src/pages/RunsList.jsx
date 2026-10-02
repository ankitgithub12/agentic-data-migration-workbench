import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, RotateCw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';

export const RunsList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['recentRuns'],
    queryFn: () => api.getRecentRuns(),
  });

  const runs = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading runs history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-brand-600 font-medium">Executions & Dry Runs</span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <PlayCircle className="w-6 h-6 text-brand-600" />
          Migration Runs &amp; Dry Runs
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Complete log of deterministic dry runs and executed migrations with reconciliation records.
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300 shadow-card text-slate-500 text-sm">
          No runs recorded yet. Select a project and run an analysis or dry run.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Run Identifier</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Plan Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Accepted / Rejected / Duplicates</th>
                  <th className="py-3 px-4">Target Inserted</th>
                  <th className="py-3 px-4">Reconciliation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      #{r._id.slice(-6)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700 font-sans font-medium">
                        {r.type === 'DRY_RUN' ? 'Deterministic Dry Run' : 'Actual Execution'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">v{r.planVersion}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-bold">{r.acceptedCount}</span> /{' '}
                      <span className="text-rose-600 font-bold">{r.rejectedCount}</span> /{' '}
                      <span className="text-amber-600 font-bold">{r.duplicateCount}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.targetInsertedCount}</td>
                    <td className="py-3 px-4">
                      <span className={r.reconciliationStatus === 'PASSED' ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {r.reconciliationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/runs/${r._id}`}
                        className="text-brand-600 hover:text-brand-700 font-sans text-xs underline font-semibold"
                      >
                        Inspect Details
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
  );
};
