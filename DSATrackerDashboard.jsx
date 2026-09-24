import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListTodo, RotateCcw, Settings, Clock, AlertCircle } from 'lucide-react';

const STATUS_ORDER = ['Not Attempted', 'Tried', 'Logic Done', 'Code Done', 'Solved', 'Solved Optimally'];
const STATUS_COLORS = {
  'Not Attempted': '#E2E4EC',
  'Tried': '#C7CCE3',
  'Logic Done': '#8B7FF5',
  'Code Done': '#4F3FF0',
  'Solved': '#10B981',
  'Solved Optimally': '#047857',
};
const STATUS_COUNTS = {
  'Not Attempted': 6,
  'Tried': 9,
  'Logic Done': 8,
  'Code Done': 5,
  'Solved': 13,
  'Solved Optimally': 11,
};
const TOTAL = Object.values(STATUS_COUNTS).reduce((a, b) => a + b, 0);

const REVISIT_ROWS = [
  { name: 'Merge Intervals', topic: 'Arrays', urgency: 'overdue', label: '3 days overdue' },
  { name: 'Course Schedule II', topic: 'Graphs', urgency: 'overdue', label: '1 day overdue' },
  { name: 'Longest Palindromic Substring', topic: 'Strings', urgency: 'today', label: 'Due today' },
  { name: 'House Robber III', topic: 'Dynamic Programming', urgency: 'today', label: 'Due today' },
];

const TOPICS = [
  { name: 'Arrays', solved: 9, total: 10 },
  { name: 'Trees', solved: 6, total: 7 },
  { name: 'Binary Search', solved: 5, total: 6 },
  { name: 'Strings', solved: 7, total: 12 },
  { name: 'Graphs', solved: 4, total: 9 },
  { name: 'Dynamic Programming', solved: 3, total: 8 },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: ListTodo, label: 'Problems' },
  { icon: RotateCcw, label: 'Revisit' },
  { icon: Settings, label: 'Settings' },
];

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState('Dashboard');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const solvedTotal = STATUS_COUNTS['Solved'] + STATUS_COUNTS['Solved Optimally'];
  const animatedTotal = useCountUp(TOTAL, mounted);
  const animatedSolved = useCountUp(solvedTotal, mounted);
  const overdueCount = REVISIT_ROWS.filter((r) => r.urgency === 'overdue').length;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-body)', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        :root {
          --bg: #F5F6FA; --surface: #FFFFFF; --border: #E3E6EF;
          --ink: #171A2B; --ink-muted: #6B7280;
          --accent: #4F3FF0; --accent-soft: #EEEBFF;
          --success: #0E9F6E; --danger: #DC2626; --danger-soft: #FDECEC; --warning: #B45309;
          --font-heading: 'Space Grotesk', sans-serif;
          --font-body: 'IBM Plex Sans', sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
        }
        .font-heading { font-family: var(--font-heading); }
        .font-mono { font-family: var(--font-mono); }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
        .nav-item { transition: background-color .2s ease, color .2s ease; }
        .nav-item:hover { background: var(--accent-soft); }
        .nav-item.active { background: var(--accent-soft); }
        .segment { transition: width .8s cubic-bezier(.16,1,.3,1); }
        .topic-fill { transition: width .8s cubic-bezier(.16,1,.3,1); }
        .revisit-row .reveal { opacity: 0; transform: translateX(6px); transition: opacity .18s ease, transform .18s ease; }
        .revisit-row:hover .reveal { opacity: 1; transform: translateX(0); }
        .topic-count { opacity: 0; transition: opacity .18s ease; }
        .topic-row:hover .topic-count { opacity: 1; }
        *:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .segment, .topic-fill, .reveal, .topic-count, .nav-item { transition: none !important; }
        }
      `}</style>

      <aside className="w-16 md:w-60 shrink-0 border-r flex flex-col py-6 px-2 md:px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-heading font-semibold text-white shrink-0" style={{ background: 'var(--accent)' }}>D</div>
          <span className="hidden md:inline font-heading font-semibold text-lg">DSA Tracker</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${active === label ? 'active' : ''}`}
              style={{ color: active === label ? 'var(--accent)' : 'var(--ink-muted)' }}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden md:block px-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Signed in as<br /><span style={{ color: 'var(--ink)' }}>dhruv@example.com</span>
        </div>
      </aside>

      <main className="flex-1 px-5 md:px-10 py-8 max-w-5xl">
        <header className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-semibold">{greeting}, Dhruv</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>Here's where your practice stands.</p>
        </header>

        <section className="card p-6 mb-6">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="font-heading text-base font-semibold mb-1">Your progress</h2>
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>{animatedTotal}</span> problems attempted
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold" style={{ color: 'var(--success)' }}>{animatedSolved}</div>
              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>solved</div>
            </div>
          </div>

          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg)' }}>
            {STATUS_ORDER.map((status, i) => {
              const pct = (STATUS_COUNTS[status] / TOTAL) * 100;
              return (
                <div
                  key={status}
                  className="segment h-full"
                  style={{ width: mounted ? `${pct}%` : '0%', background: STATUS_COLORS[status], transitionDelay: `${i * 60}ms` }}
                  title={`${status}: ${STATUS_COUNTS[status]}`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[status] }} />
                {status} <span className="font-mono" style={{ color: 'var(--ink)' }}>{STATUS_COUNTS[status]}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold">Due for revisit</h2>
              <span className="text-xs px-2 py-1 rounded-full font-mono" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                {overdueCount} overdue
              </span>
            </div>
            <div className="flex flex-col">
              {REVISIT_ROWS.map((row, i, arr) => {
                const color = row.urgency === 'overdue' ? 'var(--danger)' : row.urgency === 'today' ? 'var(--warning)' : 'var(--ink-muted)';
                const Icon = row.urgency === 'overdue' ? AlertCircle : Clock;
                return (
                  <div
                    key={row.name}
                    className="revisit-row flex items-center justify-between py-3 gap-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{row.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{row.topic}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="reveal">
                        <button className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: 'var(--accent)', color: '#fff' }}>
                          Mark reviewed
                        </button>
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono" style={{ color }}>
                        <Icon size={12} /> {row.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-heading text-base font-semibold mb-4">By topic</h2>
            <div className="flex flex-col gap-3">
              {TOPICS.map((t) => {
                const pct = (t.solved / t.total) * 100;
                return (
                  <div key={t.name} className="topic-row">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.name}</span>
                      <span className="topic-count font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>{t.solved}/{t.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                      <div className="topic-fill h-full rounded-full" style={{ width: mounted ? `${pct}%` : '0%', background: 'var(--accent)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
