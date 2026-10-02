import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  PlayCircle,
  History,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Migration Projects', icon: FolderGit2 },
  { to: '/runs', label: 'Executions & Dry Runs', icon: PlayCircle },
  { to: '/history', label: 'Audit Timeline', icon: History },
];

export const Sidebar = () => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-5 space-y-6 overflow-y-auto">
      {/* Top Nav Section */}
      <div className="space-y-6">
        <div>
          {/* Section Label */}
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
            Core Workflow
          </div>

          {/* Navigation Links */}
          <nav aria-label="Workflow Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 shadow-sm'
                        : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Widget 1: Workflow Gating Stepper Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-subtle">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold text-xs">
            <svg
              className="w-4 h-4 text-brand-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect height="14" rx="2" ry="2" width="20" x="2" y="7" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Workflow Gating</span>
          </div>
          <ol className="space-y-2 text-[12px] font-medium text-slate-600">
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">1.</span>
              <span className="text-slate-700">AI Analyzes Schemas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">2.</span>
              <span className="text-slate-700">Human Operator Reviews</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">3.</span>
              <span className="text-slate-700">Explicit Plan Approval</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">4.</span>
              <span className="text-slate-700">Deterministic Dry Run</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">5.</span>
              <span className="text-slate-700">Execution &amp; Reconciliation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-slate-400 shrink-0">6.</span>
              <span className="text-slate-500 text-[11px]">Selective Rollback (if needed)</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Widget 2: AI Safety Rule Box */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5 font-bold text-sky-800 text-[11px] tracking-wide uppercase">
          <svg
            className="w-3.5 h-3.5 text-sky-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>AI Safety Rule</span>
        </div>
        <p className="text-sky-800/90 leading-relaxed text-[11px]">
          AI proposes mappings &amp; risks. Only a human can approve. Deterministic backend executes.
        </p>
      </div>
    </aside>
  );
};
