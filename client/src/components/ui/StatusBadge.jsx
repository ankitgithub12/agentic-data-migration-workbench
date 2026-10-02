import React from 'react';

const statusConfig = {
  // Plan statuses
  DRAFT: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
  
  // Run statuses
  PENDING: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  RUNNING: { label: 'Running', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500 animate-ping' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  FAILED: { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
  ROLLED_BACK: { label: 'Rolled Back', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  
  // Reconciliation statuses
  PASSED: { label: 'Reconciled', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  
  // Risk levels
  LOW: { label: 'Low Risk', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  HIGH: { label: 'High Risk', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
  CRITICAL: { label: 'Critical Risk', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', dot: 'bg-red-500 animate-ping' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const norm = String(status || '').toUpperCase();
  const config = statusConfig[norm] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
