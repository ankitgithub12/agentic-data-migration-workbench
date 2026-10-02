import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  PlayCircle,
  AlertTriangle,
  History,
  Workflow,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Migration Projects', icon: FolderGit2 },
  { to: '/runs', label: 'Executions & Dry Runs', icon: PlayCircle },
  { to: '/history', label: 'Audit Timeline', icon: History },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 px-3">
            Core Workflow
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Workflow State Guide */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Workflow className="w-3.5 h-3.5 text-sky-400" />
            <span>Workflow Gating</span>
          </div>
          <ol className="space-y-1.5 text-slate-400 text-[11px] list-decimal list-inside">
            <li>AI Analyzes Schemas</li>
            <li>Human Operator Reviews</li>
            <li>Explicit Plan Approval</li>
            <li>Deterministic Dry Run</li>
            <li>Execution & Reconciliation</li>
            <li>Selective Rollback (if needed)</li>
          </ol>
        </div>
      </div>

      {/* Safety Policy Card */}
      <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/30 text-[11px] text-sky-300/80 leading-relaxed">
        <p className="font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Safety Rule
        </p>
        AI proposes mappings & risks. Only a human can approve. Deterministic backend executes.
      </div>
    </aside>
  );
};
