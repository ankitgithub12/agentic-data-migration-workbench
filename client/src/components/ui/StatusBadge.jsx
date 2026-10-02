import React from 'react';

const statusConfig = {
  // Plan statuses
  DRAFT: { label: 'Draft', bg: 'bg-slate-800', text: 'text-slate-300', dot: 'bg-slate-400' },
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-950/60', text: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-950/60', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-950/60', text: 'text-rose-300', dot: 'bg-rose-400' },
  
  // Run statuses
  PENDING: { label: 'Pending', bg: 'bg-slate-800', text: 'text-slate-300', dot: 'bg-slate-400' },
  RUNNING: { label: 'Running', bg: 'bg-sky-950/60', text: 'text-sky-300', dot: 'bg-sky-400 animate-ping' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-950/60', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  FAILED: { label: 'Failed', bg: 'bg-rose-950/60', text: 'text-rose-300', dot: 'bg-rose-400' },
  ROLLED_BACK: { label: 'Rolled Back', bg: 'bg-purple-950/60', text: 'text-purple-300', dot: 'bg-purple-400' },
  
  // Reconciliation statuses
  PASSED: { label: 'Reconciled', bg: 'bg-emerald-950/60', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  
  // Risk levels
  LOW: { label: 'Low Risk', bg: 'bg-slate-800', text: 'text-slate-300', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-950/60', text: 'text-amber-300', dot: 'bg-amber-400' },
  HIGH: { label: 'High Risk', bg: 'bg-rose-950/60', text: 'text-rose-300', dot: 'bg-rose-400' },
  CRITICAL: { label: 'Critical Risk', bg: 'bg-red-950', text: 'text-red-200', dot: 'bg-red-400 animate-ping' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const norm = String(status || '').toUpperCase();
  const config = statusConfig[norm] || {
    label: status || 'Unknown',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700/50 ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
