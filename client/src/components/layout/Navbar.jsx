import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Database, ShieldCheck, Sparkles, Activity, Layers } from 'lucide-react';
import { api } from '../../services/api';

export const Navbar = () => {
  const { data: healthData } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getHealth,
    refetchInterval: 15000,
  });

  const isConnected = healthData?.database === 'connected';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Migration Workbench
            </span>
            <span className="block text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Agentic Planner & Reconciliation
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Database:</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'
              }`}
            />
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? (healthData?.databaseMode === 'in-memory-embedded' ? 'Memory DB' : 'MongoDB') : 'Offline'}
            </span>
          </span>
        </div>

        {/* AI Advisory Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>AI Advisory</span>
          <span className="text-slate-500">|</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400/90 font-medium">Human Approval Gated</span>
        </div>
      </div>
    </header>
  );
};
