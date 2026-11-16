import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, Plus, Settings } from 'lucide-react';
import { APP_NAME } from '../lib/constants';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/today', label: 'Today', Icon: CheckCircle2 },
    { to: '/progress', label: 'Progress', Icon: BarChart3 },
    { to: '/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Top Navigation (3-zone contract) */}
      <header className="hidden md:block sticky top-0 z-30 bg-[var(--bg-canvas)]/92 backdrop-blur-md border-b border-[var(--border-hairline)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <NavLink
            to="/today"
            className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            {APP_NAME}
          </NavLink>

          <nav className="flex items-center gap-7" aria-label="Primary">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[var(--color-primary)] border-[var(--color-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              New habit
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Fixed Bottom 3-Tab Navigation */}
      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/92 backdrop-blur-md border-t border-[var(--border-hairline)] safe-pb"
      >
        <div className="grid grid-cols-3 h-16 items-center max-w-lg mx-auto">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[48px] text-[11px] font-medium tracking-tight transition-colors ${
                  isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--text-secondary)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                  <span className="mt-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
