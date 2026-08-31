import { useEffect, useMemo, useState } from 'react';
import { Film, Calendar, Clock, Armchair, User, Clapperboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Movie, Show, ShowType } from '@/lib/types';
import { Button } from '@/components/Button';
import { FieldWrapper, Input, Select } from '@/components/Field';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { createBooking } from '@/lib/bookingApi';
import type { Booking } from '@/lib/types';

interface NewBookingProps {
  onCreated: (b: Booking) => void;
}

interface FormState {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  movie_id: string;
  show_id: string;
  number_of_tickets: string;
  show_type: ShowType;
}

interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  movie_id?: string;
  show_id?: string;
  number_of_tickets?: string;
  show_type?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s()-]{6,}$/;

const emptyForm: FormState = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  movie_id: '',
  show_id: '',
  number_of_tickets: '1',
  show_type: 'Standard',
};

export function NewBooking({ onCreated }: NewBookingProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('movies').select('*').order('movie_name').then(({ data }) => setMovies((data || []) as Movie[]));
    supabase.from('shows').select('*').order('show_date, show_time').then(({ data }) => setShows((data || []) as Show[]));
  }, []);

  const selectedMovie = useMemo(() => movies.find((m) => m.id === form.movie_id) || null, [movies, form.movie_id]);

  // Shows filtered by selected movie and chosen show type
  const availableShows = useMemo(() => {
    return shows.filter((s) => {
      if (form.movie_id && s.movie_id !== form.movie_id) return false;
      if (s.show_type !== form.show_type) return false;
      return true;
    });
  }, [shows, form.movie_id, form.show_type]);

  const selectedShow = useMemo(() => shows.find((s) => s.id === form.show_id) || null, [shows, form.show_id]);

  const totalCost = useMemo(() => {
    if (!selectedShow) return 0;
    const n = parseInt(form.number_of_tickets, 10);
    if (isNaN(n) || n <= 0) return 0;
    return Number(selectedShow.ticket_price) * n;
  }, [selectedShow, form.number_of_tickets]);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required.';
    if (!form.customer_email.trim()) e.customer_email = 'Customer email is required.';
    else if (!EMAIL_RE.test(form.customer_email)) e.customer_email = 'Enter a valid email address.';
    if (!form.customer_phone.trim()) e.customer_phone = 'Customer phone is required.';
    else if (!PHONE_RE.test(form.customer_phone)) e.customer_phone = 'Enter a valid phone number.';
    if (!form.movie_id) e.movie_id = 'Please select a movie.';
    if (!form.show_id) e.show_id = 'Please select a show.';
    const n = parseInt(form.number_of_tickets, 10);
    if (!form.number_of_tickets || isNaN(n)) e.number_of_tickets = 'Number of tickets is required.';
    else if (n <= 0) e.number_of_tickets = 'Number of tickets must be greater than zero.';
    if (!form.show_type) e.show_type = 'Show type is required.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        movie_id: form.movie_id,
        show_id: form.show_id,
        number_of_tickets: parseInt(form.number_of_tickets, 10),
        show_type: form.show_type,
      });
      onCreated(booking);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit booking request.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'movie_id' || key === 'show_type') {
        next.show_id = '';
      }
      return next;
    });
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Movie Ticket Request</h1>
        <p className="text-sm text-slate-500">Fill in your details and choose a movie and show to submit a booking request.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Form fields */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer details */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4 text-sky-500" /> Customer Details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FieldWrapper label="Customer Name" required error={errors.customer_name}>
                <Input
                  value={form.customer_name}
                  onChange={(e) => update('customer_name', e.target.value)}
                  placeholder="Jane Doe"
                  error={errors.customer_name}
                />
              </FieldWrapper>
              <FieldWrapper label="Customer Email" required error={errors.customer_email}>
                <Input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => update('customer_email', e.target.value)}
                  placeholder="jane@example.com"
                  error={errors.customer_email}
                />
              </FieldWrapper>
              <FieldWrapper label="Customer Phone" required error={errors.customer_phone}>
                <Input
                  value={form.customer_phone}
                  onChange={(e) => update('customer_phone', e.target.value)}
                  placeholder="+1 555 123 4567"
                  error={errors.customer_phone}
                />
              </FieldWrapper>
            </div>
          </section>

          {/* Movie & Show details */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clapperboard className="h-4 w-4 text-sky-500" /> Movie & Show
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FieldWrapper label="Movie Name" required error={errors.movie_id}>
                <Select value={form.movie_id} onChange={(e) => update('movie_id', e.target.value)} error={errors.movie_id}>
                  <option value="">Select a movie…</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.movie_name} {m.genre ? `(${m.genre})` : ''}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Show Type" required error={errors.show_type}>
                <Select value={form.show_type} onChange={(e) => update('show_type', e.target.value as ShowType)} error={errors.show_type}>
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                </Select>
              </FieldWrapper>
            </div>

            {selectedMovie && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-sky-500 ring-1 ring-slate-200">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{selectedMovie.movie_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedMovie.genre} · {selectedMovie.language} · {selectedMovie.duration} min
                    </p>
                    {selectedMovie.description && <p className="mt-1.5 text-xs text-slate-500">{selectedMovie.description}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FieldWrapper label="Show (Date & Time)" required error={errors.show_id}>
                <Select value={form.show_id} onChange={(e) => update('show_id', e.target.value)} error={errors.show_id}>
                  <option value="">Select a show…</option>
                  {availableShows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.show_date)} · {formatTime(s.show_time)} · {s.theatre_name} {s.screen_name} · {s.available_seats_count} seats left
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Number of Tickets" required error={errors.number_of_tickets}>
                <Input
                  type="number"
                  min={1}
                  value={form.number_of_tickets}
                  onChange={(e) => update('number_of_tickets', e.target.value)}
                  placeholder="1"
                  error={errors.number_of_tickets}
                />
              </FieldWrapper>
            </div>
          </section>

          {submitError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={submitting}>Submit Booking Request</Button>
            <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setErrors({}); setSubmitError(null); }}>
              Clear
            </Button>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Booking Summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow icon={<Film className="h-4 w-4" />} label="Movie" value={selectedMovie?.movie_name || '—'} />
                <SummaryRow icon={<Calendar className="h-4 w-4" />} label="Date" value={selectedShow ? formatDate(selectedShow.show_date) : '—'} />
                <SummaryRow icon={<Clock className="h-4 w-4" />} label="Time" value={selectedShow ? formatTime(selectedShow.show_time) : '—'} />
                <SummaryRow icon={<Clapperboard className="h-4 w-4" />} label="Show Type" value={form.show_type} />
                <SummaryRow icon={<Armchair className="h-4 w-4" />} label="Tickets" value={form.number_of_tickets || '—'} />
                <SummaryRow icon={<Armchair className="h-4 w-4" />} label="Available" value={selectedShow ? `${selectedShow.available_seats_count} seats` : '—'} />
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-slate-500">Ticket Price</dt>
                    <dd className="text-sm font-semibold text-slate-900">{selectedShow ? formatCurrency(selectedShow.ticket_price) : '—'}</dd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-base font-semibold text-slate-700">Total Cost</dt>
                  <dd className="text-base font-bold text-sky-700">{formatCurrency(totalCost)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-400">Total Cost = Ticket Price × Number of Tickets. Calculated automatically.</p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-700">
              <p className="font-semibold">How it works</p>
              <p className="mt-1">After you submit, a Booking Agent verifies seat availability. You'll then review the total cost and confirm or cancel before the booking is executed.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
