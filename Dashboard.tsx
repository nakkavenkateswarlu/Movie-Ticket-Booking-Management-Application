import { useEffect, useState } from 'react';
import { Ticket, CheckCircle2, Clock, AlertTriangle, Film, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDate, formatTime, shortCaseId, slaGoalStatus } from '@/lib/utils';

interface DashboardProps {
  onNavigate: (v: { name: 'booking'; id: string } | { name: 'new-booking' } | { name: 'bookings' }) => void;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  inProgress: number;
  goalMissed: number;
  deadlineMissed: number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, pending: 0, cancelled: 0, inProgress: 0, goalMissed: 0, deadlineMissed: 0 });
  const [recent, setRecent] = useState<Booking[]>([]);
  const [queueCounts, setQueueCounts] = useState<{ PremiumShowQueue: number; StandardShowQueue: number }>({ PremiumShowQueue: 0, StandardShowQueue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      const all = (bookings || []) as Booking[];

      const inProgress = all.filter((b) => b.stage !== 'Resolved');
      const now = Date.now();
      const goalMissed = inProgress.filter((b) => {
        const s = slaGoalStatus(b);
        return s === 'goal-missed' || s === 'deadline-missed';
      }).length;
      const deadlineMissed = inProgress.filter((b) => {
        if (!b.sla_deadline_at) return false;
        return now > new Date(b.sla_deadline_at).getTime();
      }).length;

      setStats({
        total: all.length,
        confirmed: all.filter((b) => b.resolution_status === 'Confirmed').length,
        pending: inProgress.length,
        cancelled: all.filter((b) => b.resolution_status === 'Cancelled').length,
        inProgress: inProgress.length,
        goalMissed,
        deadlineMissed,
      });

      setRecent(all.slice(0, 6));

      setQueueCounts({
        PremiumShowQueue: all.filter((b) => b.work_queue === 'PremiumShowQueue' && b.stage !== 'Resolved').length,
        StandardShowQueue: all.filter((b) => b.work_queue === 'StandardShowQueue' && b.stage !== 'Resolved').length,
      });

      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Requests', value: stats.total, icon: Ticket, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'SLA At Risk', value: stats.goalMissed, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Booking Management Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of all Movie Ticket Request cases, work queues, and SLA status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="text-2xl font-bold text-slate-900">{s.value}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Work queues */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Work Queues</h2>
          <p className="mt-0.5 text-xs text-slate-400">Routed by Show Type (Booking Execution)</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <div>
                <p className="text-sm font-semibold text-amber-800">PremiumShowQueue</p>
                <p className="text-xs text-amber-600">Premium show type</p>
              </div>
              <span className="text-xl font-bold text-amber-700">{queueCounts.PremiumShowQueue}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200">
              <div>
                <p className="text-sm font-semibold text-sky-800">StandardShowQueue</p>
                <p className="text-xs text-sky-600">Standard show type</p>
              </div>
              <span className="text-xl font-bold text-sky-700">{queueCounts.StandardShowQueue}</span>
            </div>
          </div>
        </div>

        {/* SLA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">SLA Status</h2>
          <p className="mt-0.5 text-xs text-slate-400">Goal: 1 day · Deadline: 2 days</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-sm font-medium text-amber-700">Goal Missed</p>
              <span className="text-xl font-bold text-amber-700">{stats.goalMissed}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
              <p className="text-sm font-medium text-red-700">Deadline Missed</p>
              <span className="text-xl font-bold text-red-700">{stats.deadlineMissed}</span>
            </div>
            <p className="text-xs text-slate-400">Deadline misses automatically increase case urgency.</p>
          </div>
        </div>

        {/* Resolution summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Resolution Summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="success">Confirmed</Badge>
              <span className="text-lg font-bold text-slate-700">{stats.confirmed}</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="error">Cancelled</Badge>
              <span className="text-lg font-bold text-slate-700">{stats.cancelled}</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="warning">In Progress</Badge>
              <span className="text-lg font-bold text-slate-700">{stats.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Booking Requests</h2>
          <button
            onClick={() => onNavigate({ name: 'bookings' })}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Loading…</div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Film className="h-6 w-6" />}
            title="No bookings yet"
            description="Create the first Movie Ticket Request to get started."
            action={
              <button
                onClick={() => onNavigate({ name: 'new-booking' })}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" /> New Booking
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((b) => {
              const sla = slaGoalStatus(b);
              return (
                <button
                  key={b.id}
                  onClick={() => onNavigate({ name: 'booking', id: b.id })}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{b.movie_name || '—'}</p>
                      <p className="text-xs text-slate-500">
                        {shortCaseId(b.id)} · {b.customer_name} · {formatDate(b.show_date)} {formatTime(b.show_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-sm font-medium text-slate-700 sm:block">{formatCurrency(b.total_cost)}</span>
                    {b.resolution_status === 'Confirmed' && <Badge variant="success">Confirmed</Badge>}
                    {b.resolution_status === 'Cancelled' && <Badge variant="error">Cancelled</Badge>}
                    {!b.resolution_status && b.stage === 'Initial' && <Badge variant="neutral">Initial</Badge>}
                    {!b.resolution_status && b.stage === 'Availability' && <Badge variant="info">Availability</Badge>}
                    {!b.resolution_status && b.stage === 'Approval' && <Badge variant="warning">Approval</Badge>}
                    {!b.resolution_status && b.stage === 'Booking Execution' && (
                      <Badge variant={b.work_queue === 'PremiumShowQueue' ? 'premium' : 'info'}>
                        {b.work_queue}
                      </Badge>
                    )}
                    {sla === 'deadline-missed' && <Badge variant="error">SLA Over</Badge>}
                    {sla === 'goal-missed' && <Badge variant="warning">SLA At Risk</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
