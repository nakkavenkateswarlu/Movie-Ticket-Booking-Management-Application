import { useEffect, useState } from 'react';
import { Mail, Search, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Correspondence } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@/lib/utils';

export function CorrespondenceView() {
  const [items, setItems] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Correspondence | null>(null);

  useEffect(() => {
    supabase
      .from('correspondence')
      .select('*')
      .order('sent_at', { ascending: false })
      .then(({ data }) => {
        setItems((data || []) as Correspondence[]);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${c.customer_name} ${c.customer_email} ${c.subject} ${c.case_id}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Correspondence</h1>
        <p className="text-sm text-slate-500">Automated booking confirmation emails sent after successful case resolution.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails…" className="pl-9" />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No emails yet"
            description="Confirmation emails appear here automatically after a booking is successfully completed."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.subject}</p>
                    <Badge variant="success">Sent</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    To: {c.customer_email} · {c.customer_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(c.sent_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Confirmation Email" maxWidth="max-w-2xl">
        {selected && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">To</span>
                <Badge variant="success">Sent</Badge>
              </div>
              <p className="font-medium text-slate-700">{selected.customer_email}</p>
              <p className="mt-2 text-xs text-slate-400">Subject</p>
              <p className="font-medium text-slate-700">{selected.subject}</p>
              <p className="mt-2 text-xs text-slate-400">Sent at</p>
              <p className="font-medium text-slate-700">{formatDateTime(selected.sent_at)}</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-mono text-slate-700 overflow-x-auto">{selected.body}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
