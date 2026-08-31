import { useEffect, useMemo, useState } from 'react';
import { Search, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, CaseStage } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Field';
import { formatCurrency, formatDate, formatTime, shortCaseId, slaGoalStatus } from '@/lib/utils';

interface BookingListProps {
  onOpen: (id: string) => void;
}

const STAGE_FILTERS: (CaseStage | 'All')[] = ['All', 'Initial', 'Availability', 'Approval', 'Booking Execution', 'Resolved'];

export function BookingList({ onOpen }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CaseStage | 'All'>('All');

  useEffect(() => {
    supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings((data || []) as Booking[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (stageFilter !== 'All' && b.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${b.customer_name} ${b.movie_name} ${shortCaseId(b.id)} ${b.booking_confirmation_status} ${b.work_queue}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, search, stageFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Booking Requests</h1>
        <p className="text-sm text-slate-500">All Movie Ticket Request cases across every stage.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, customer, movie, status…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGE_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                stageFilter === s ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Loading bookings…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon={<Film className="h-6 w-6" />}
            title="No bookings found"
            description="Try adjusting your search or filters."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Case ID</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Movie</th>
                <th className="px-5 py-3 font-medium">Show</th>
                <th className="px-5 py-3 font-medium">Tickets</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => {
                const sla = slaGoalStatus(b);
                return (
                  <tr
                    key={b.id}
                    onClick={() => onOpen(b.id)}
                    className="cursor-pointer hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">{shortCaseId(b.id)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{b.customer_name}</p>
                      <p className="text-xs text-slate-400">{b.customer_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{b.movie_name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {formatDate(b.show_date)} {formatTime(b.show_time)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{b.number_of_tickets}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{formatCurrency(b.total_cost)}</td>
                    <td className="px-5 py-3.5">
                      {b.resolution_status === 'Confirmed' ? (
                        <Badge variant="success">Confirmed</Badge>
                      ) : b.resolution_status === 'Cancelled' ? (
                        <Badge variant="error">Cancelled</Badge>
                      ) : b.stage === 'Booking Execution' ? (
                        <Badge variant={b.work_queue === 'PremiumShowQueue' ? 'premium' : 'info'}>{b.work_queue}</Badge>
                      ) : (
                        <Badge variant={b.stage === 'Approval' ? 'warning' : b.stage === 'Availability' ? 'info' : 'neutral'}>{b.stage}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.stage === 'Resolved' ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : sla === 'deadline-missed' ? (
                        <Badge variant="error">Over</Badge>
                      ) : sla === 'goal-missed' ? (
                        <Badge variant="warning">At Risk</Badge>
                      ) : (
                        <Badge variant="success">On Track</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
