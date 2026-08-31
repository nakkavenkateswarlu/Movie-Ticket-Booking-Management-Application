import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Film,
  Calendar,
  Clock,
  Armchair,
  Clapperboard,
  DollarSign,
  Ticket,
  CheckCircle2,
  XCircle,
  Mail as MailIcon,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, Correspondence } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { StageProgress } from '@/components/StageProgress';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  shortCaseId,
  slaGoalStatus,
} from '@/lib/utils';
import { cancelBooking, confirmBooking, executeBooking, verifyAvailability } from '@/lib/bookingApi';

interface BookingDetailProps {
  bookingId: string;
  onBack: () => void;
}

export function BookingDetail({ bookingId, onBack }: BookingDetailProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [correspondence, setCorrespondence] = useState<Correspondence | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle<Booking>();
    setBooking(data);
    if (data?.email_sent) {
      const { data: corr } = await supabase
        .from('correspondence')
        .select('*')
        .eq('booking_id', bookingId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle<Correspondence>();
      setCorrespondence(corr);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    loadBooking();
  }, [bookingId, loadBooking]);

  async function handleVerifyAvailability() {
    if (!booking) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await verifyAvailability(booking.id);
      setBooking(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify availability.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    if (!booking) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await confirmBooking(booking.id);
      setBooking(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      setShowCancelModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExecute() {
    if (!booking) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await executeBooking(booking.id);
      setBooking(updated);
      // reload to fetch correspondence
      await loadBooking();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute booking.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Loading booking…</div>;
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <BackButton onBack={onBack} />
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Booking not found.
        </div>
      </div>
    );
  }

  const sla = slaGoalStatus(booking);
  const isResolved = booking.stage === 'Resolved';
  const isCancelled = booking.resolution_status === 'Cancelled';
  const isConfirmed = booking.resolution_status === 'Confirmed';
  const inApproval = booking.stage === 'Approval';
  const inAvailability = booking.stage === 'Availability';
  const inBookingExecution = booking.stage === 'Booking Execution';
  const inInitial = booking.stage === 'Initial';

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{booking.movie_name || 'Movie Ticket Request'}</h1>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">{shortCaseId(booking.id)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {booking.customer_name} · {formatDate(booking.show_date)} {formatTime(booking.show_time)} · {booking.number_of_tickets} tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConfirmed && <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Confirmed</Badge>}
          {isCancelled && <Badge variant="error"><XCircle className="h-3 w-3" /> Cancelled</Badge>}
          {!isResolved && <Badge variant={booking.stage === 'Approval' ? 'warning' : 'info'}>{booking.stage}</Badge>}
          {booking.work_queue && !isResolved && (
            <Badge variant={booking.work_queue === 'PremiumShowQueue' ? 'premium' : 'info'}>{booking.work_queue}</Badge>
          )}
          {!isResolved && sla === 'deadline-missed' && <Badge variant="error">SLA Over</Badge>}
          {!isResolved && sla === 'goal-missed' && <Badge variant="warning">SLA At Risk</Badge>}
        </div>
      </div>

      {/* Stage progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <StageProgress currentStage={booking.stage} resolutionStatus={booking.resolution_status} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4 text-sky-500" /> Customer Information
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <DetailItem icon={<User className="h-4 w-4" />} label="Name" value={booking.customer_name} />
              <DetailItem icon={<Mail className="h-4 w-4" />} label="Email" value={booking.customer_email} />
              <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={booking.customer_phone} />
            </div>
          </section>

          {/* Show info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Film className="h-4 w-4 text-sky-500" /> Movie & Show
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem icon={<Film className="h-4 w-4" />} label="Movie" value={booking.movie_name} />
              <DetailItem icon={<Clapperboard className="h-4 w-4" />} label="Genre" value={booking.genre} />
              <DetailItem icon={<Calendar className="h-4 w-4" />} label="Show Date" value={formatDate(booking.show_date)} />
              <DetailItem icon={<Clock className="h-4 w-4" />} label="Show Time" value={formatTime(booking.show_time)} />
              <DetailItem icon={<Clapperboard className="h-4 w-4" />} label="Show Type" value={booking.show_type} />
              <DetailItem icon={<Armchair className="h-4 w-4" />} label="Tickets" value={String(booking.number_of_tickets)} />
            </div>
          </section>

          {/* Availability & Cost */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-sky-500" /> Availability & Cost
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                icon={<Armchair className="h-4 w-4" />}
                label="Available Seats"
                value={booking.available_seats_count != null ? String(booking.available_seats_count) : '—'}
              />
              <div>
                <p className="mb-1 text-xs font-medium text-slate-400">Seat Availability</p>
                {booking.seat_availability_status ? (
                  <Badge variant={booking.seat_availability_status === 'Available' ? 'success' : 'error'}>
                    {booking.seat_availability_status}
                  </Badge>
                ) : (
                  <span className="text-sm text-slate-400">Not checked yet</span>
                )}
              </div>
              <DetailItem icon={<DollarSign className="h-4 w-4" />} label="Ticket Price" value={formatCurrency(booking.ticket_price)} />
              <DetailItem icon={<DollarSign className="h-4 w-4" />} label="Total Cost" value={formatCurrency(booking.total_cost)} highlighted />
              <div className="sm:col-span-2">
                <DetailItem icon={<Ticket className="h-4 w-4" />} label="Ticket ID" value={booking.ticket_id || '—'} />
              </div>
              {booking.seat_numbers && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <DetailItem icon={<Armchair className="h-4 w-4" />} label="Seat Numbers" value={booking.seat_numbers} />
                </div>
              )}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Total Cost = Ticket Price × Number of Tickets = {formatCurrency(booking.ticket_price)} × {booking.number_of_tickets} = <span className="font-semibold text-slate-700">{formatCurrency(booking.total_cost)}</span>
            </div>
          </section>

          {/* Correspondence */}
          {correspondence && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MailIcon className="h-4 w-4 text-sky-500" /> Confirmation Email
                </h2>
                <Button variant="ghost" onClick={() => setShowEmailModal(true)}>View Email</Button>
              </div>
              <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <p className="font-medium">Email sent to {correspondence.customer_email}</p>
                <p className="text-xs">{correspondence.subject}</p>
                <p className="mt-1 text-xs">Sent {formatDateTime(correspondence.sent_at)}</p>
              </div>
            </section>
          )}
        </div>

        {/* Actions panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Stage action card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Case Actions</h3>
              <p className="mt-1 text-xs text-slate-400">Current stage: <span className="font-medium text-slate-600">{booking.stage}</span></p>

              <div className="mt-4 space-y-3">
                {/* Initial stage - submitted, waiting for availability check */}
                {inInitial && (
                  <div className="rounded-xl bg-sky-50 p-3 text-xs text-sky-700 ring-1 ring-sky-200">
                    Booking request submitted. A Booking Agent will verify seat availability next.
                  </div>
                )}

                {/* Availability stage */}
                {inAvailability && (
                  <>
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-200">
                      <p className="font-semibold">Verify Show Availability</p>
                      <p className="mt-0.5">Check if {booking.number_of_tickets} seats are available (currently {booking.available_seats_count}).</p>
                    </div>
                    {booking.seat_availability_status === 'Not Available' && (
                      <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
                        Insufficient seats available. The case cannot proceed to Approval.
                      </div>
                    )}
                    <Button onClick={handleVerifyAvailability} loading={actionLoading} className="w-full">
                      Verify Availability
                    </Button>
                  </>
                )}

                {/* Approval stage */}
                {inApproval && (
                  <>
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-200">
                      <p className="font-semibold">Customer Confirmation Required</p>
                      <p className="mt-0.5">Review the booking details and total cost, then confirm or cancel.</p>
                    </div>
                    <Button onClick={handleConfirm} loading={actionLoading} className="w-full">
                      Confirm Booking
                    </Button>
                    <Button variant="danger" onClick={() => setShowCancelModal(true)} className="w-full">
                      Cancel Booking
                    </Button>
                  </>
                )}

                {/* Booking Execution */}
                {inBookingExecution && (
                  <>
                    <div className="rounded-xl bg-sky-50 p-3 text-xs text-sky-700 ring-1 ring-sky-200">
                      <p className="font-semibold">Execute Booking</p>
                      <p className="mt-0.5">
                        Routed to <span className="font-semibold">{booking.work_queue}</span>. Execute to allocate seats, generate Ticket ID, and send confirmation email.
                      </p>
                    </div>
                    <Button onClick={handleExecute} loading={actionLoading} className="w-full">
                      Execute Booking
                    </Button>
                  </>
                )}

                {/* Resolved */}
                {isResolved && (
                  <div className={`rounded-xl p-3 text-xs ring-1 ${isConfirmed ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
                    <p className="font-semibold">{isConfirmed ? 'Booking Confirmed' : 'Booking Cancelled'}</p>
                    <p className="mt-0.5">
                      {isConfirmed
                        ? `Ticket ID: ${booking.ticket_id}. Confirmation email sent to ${booking.customer_email}.`
                        : 'No seats were allocated. No confirmation email was sent.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SLA card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">SLA</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Goal (1 day)</span>
                  <span className="font-medium text-slate-700">{formatDateTime(booking.sla_goal_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Deadline (2 days)</span>
                  <span className="font-medium text-slate-700">{formatDateTime(booking.sla_deadline_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Urgency</span>
                  <span className="font-medium text-slate-700">{booking.urgency}</span>
                </div>
                {!isResolved && sla === 'goal-missed' && (
                  <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-amber-700 ring-1 ring-amber-200">Goal missed — approaching deadline.</div>
                )}
                {!isResolved && sla === 'deadline-missed' && (
                  <div className="rounded-lg bg-red-50 px-2 py-1.5 text-red-700 ring-1 ring-red-200">Deadline missed — urgency increased.</div>
                )}
              </div>
            </div>

            {/* Routing info */}
            {booking.work_queue && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Work Queue Routing</h3>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Show Type</span>
                  <Badge variant={booking.show_type === 'Premium' ? 'premium' : 'info'}>{booking.show_type}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Routed To</span>
                  <span className="font-semibold text-slate-700">{booking.work_queue}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Booking?">
        <p className="text-sm text-slate-600">
          This will cancel the booking request. No seats will be allocated, no Ticket ID will be generated, and no confirmation email will be sent. The case will be resolved as cancelled.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="danger" onClick={handleCancel} loading={actionLoading}>Yes, Cancel Booking</Button>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Booking</Button>
        </div>
      </Modal>

      {/* Email modal */}
      <Modal open={showEmailModal} onClose={() => setShowEmailModal(false)} title="Confirmation Email" maxWidth="max-w-2xl">
        {correspondence && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-400">To</p>
              <p className="font-medium text-slate-700">{correspondence.customer_email}</p>
              <p className="mt-2 text-xs text-slate-400">Subject</p>
              <p className="font-medium text-slate-700">{correspondence.subject}</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-mono text-slate-700 overflow-x-auto">{correspondence.body}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Bookings
    </button>
  );
}

function DetailItem({
  icon,
  label,
  value,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  highlighted?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span className="text-slate-300">{icon}</span>
        {label}
      </p>
      <p className={`text-sm ${highlighted ? 'font-bold text-sky-700' : 'font-medium text-slate-900'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
