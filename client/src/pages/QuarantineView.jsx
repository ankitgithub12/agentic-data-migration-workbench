import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Code,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';

export const QuarantineView = () => {
  const { id: runId } = useParams();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterRule, setFilterRule] = useState('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['quarantine', runId],
    queryFn: () => api.getQuarantineRecords(runId),
  });

  const records = data?.data || [];

  const rules = ['ALL', ...new Set(records.flatMap((r) => r.fieldErrors.map((fe) => fe.rule)))];

  const filteredRecords = records.filter((r) => {
    if (filterRule === 'ALL') return true;
    return r.fieldErrors.some((fe) => fe.rule === filterRule);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading quarantined records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to={`/runs/${runId}`} className="hover:text-slate-800 transition-colors">Run #{runId.slice(-6)}</Link>
            <span>/</span>
            <span className="font-mono text-amber-600 font-medium">Quarantine</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Quarantine Workbench
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono font-medium border border-amber-200">
              {records.length} Rejected
            </span>
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Records failing deterministic validation are isolated here with full field-level audit evidence.
          </p>
        </div>

        <Link
          to={`/runs/${runId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 shadow-subtle transition shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Run Diagnostics
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex items-center gap-3 text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600 font-medium">Filter by Validation Rule:</span>
        <div className="flex flex-wrap gap-2">
          {rules.map((rule) => (
            <button
              key={rule}
              onClick={() => setFilterRule(rule)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition font-medium ${
                filterRule === rule
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {rule}
            </button>
          ))}
        </div>
      </div>

      {/* Section 38: Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300 shadow-card">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No rejected records</h3>
          <p className="text-xs text-slate-500 mt-1">
            All records in this dataset passed deterministic schema validation successfully.
          </p>
        </div>
      ) : (
        /* Quarantined Records Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record Identifier</th>
                  <th className="py-3 px-4">Failed Field</th>
                  <th className="py-3 px-4">Original Value</th>
                  <th className="py-3 px-4">Validation Rule</th>
                  <th className="py-3 px-4">Error Evidence</th>
                  <th className="py-3 px-4 text-right">Inspect Raw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ID: {String(item.sourceRecordId)}
                    </td>
                    <td className="py-3 px-4">
                      {item.fieldErrors.map((fe, idx) => (
                        <span key={idx} className="block text-rose-600 font-bold">
                          {fe.field}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate">
                      {item.fieldErrors.map((fe, idx) => (
                        <span key={idx} className="block">
                          {fe.value !== undefined ? String(fe.value) : '<empty>'}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      {item.fieldErrors.map((fe, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] mr-1 font-semibold"
                        >
                          {fe.rule}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans text-xs max-w-xs">
                      {item.errors.join('; ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-brand-700 font-sans text-xs font-semibold border border-slate-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Record Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Quarantined Record #${selectedRecord?.sourceRecordId}`}
        maxWidth="max-w-2xl"
      >
        {selectedRecord && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Field Failures & Violations:
              </span>
              <div className="space-y-1.5">
                {selectedRecord.fieldErrors.map((fe, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                    <p className="font-bold text-rose-800">
                      Field: <span className="text-rose-950 font-mono">{fe.field}</span> (Rule: {fe.rule})
                    </p>
                    <p className="text-rose-700 text-[11px] mt-0.5">{fe.error}</p>
                    <p className="text-rose-600 text-[11px] mt-0.5">Value: "{String(fe.value)}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Original Unmodified Source Record:
              </span>
              <pre className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 overflow-x-auto text-[11px] leading-relaxed font-mono">
                {JSON.stringify(selectedRecord.sourceRecord, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
