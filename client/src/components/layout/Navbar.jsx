import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const Navbar = () => {
  const { data: healthData } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getHealth,
    refetchInterval: 15000,
  });

  const isConnected = healthData?.database === 'connected';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-subtle shrink-0">
      {/* Brand identity and system title */}
      <div className="flex items-center gap-3.5">
        <Link to="/" className="flex items-center gap-3.5 group">
          {/* Layered Logo Icon */}
          <div
            aria-label="Workbench Logo"
            className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-600 to-cyan-400 p-[1px] shadow-sm flex items-center justify-center text-white group-hover:scale-105 transition-transform"
          >
            <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-sky-500 rounded-[11px] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white drop-shadow-sm"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* App name & subtitle */}
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Migration Workbench
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 font-mono uppercase">
              AGENTIC PLANNER &amp; RECONCILIATION
            </p>
          </div>
        </Link>
      </div>

      {/* Header Right: System status pills and Operator Profile */}
      <div className="flex items-center gap-4">
        {/* Database Connection Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-slate-500">Database:</span>
          <div
            className={`flex items-center gap-1.5 font-semibold ${
              isConnected ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  {healthData?.databaseMode === 'in-memory-embedded' ? 'Memory DB' : 'MongoDB'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Environment Pill */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
          staging-us-east-1
        </div>

        {/* Operator User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-brand-700 ring-2 ring-brand-50">
            OP
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-600">
            operator@acme.ai
          </span>
        </div>
      </div>
    </header>
  );
};
