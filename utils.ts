import type { Booking } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(value: string | null): string {
  if (!value) return '—';
  // value may be "HH:MM:SS"
  const parts = value.split(':');
  if (parts.length < 2) return value;
  const [hStr, mStr] = parts;
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function shortCaseId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function slaGoalStatus(booking: Booking): 'ok' | 'goal-missed' | 'deadline-missed' {
  const now = Date.now();
  const goal = booking.sla_goal_at ? new Date(booking.sla_goal_at).getTime() : null;
  const deadline = booking.sla_deadline_at ? new Date(booking.sla_deadline_at).getTime() : null;
  if (deadline && now > deadline) return 'deadline-missed';
  if (goal && now > goal) return 'goal-missed';
  return 'ok';
}

export function generateTicketId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CW-${ts}-${rand}`;
}

export function generateSeatNumbers(count: number, startFrom: number = 1): string {
  const seats: string[] = [];
  for (let i = 0; i < count; i++) {
    const num = startFrom + i;
    const row = String.fromCharCode(65 + Math.floor((num - 1) / 12));
    const col = ((num - 1) % 12) + 1;
    seats.push(`${row}${col}`);
  }
  return seats.join(', ');
}

export function buildConfirmationEmail(booking: Booking): { subject: string; body: string } {
  const caseId = shortCaseId(booking.id);
  const subject = `Movie Ticket Booking Confirmed - ${caseId}`;
  const showDateTime = `${formatDate(booking.show_date)} ${formatTime(booking.show_time)}`;
  const totalCost = formatCurrency(booking.total_cost);
  const body = `Dear ${booking.customer_name || 'Customer'},

Your movie ticket booking has been successfully confirmed.

Booking Details:

Case ID: ${caseId}

Movie Name: ${booking.movie_name || '—'}

Show Date & Time: ${showDateTime}

Number of Tickets: ${booking.number_of_tickets}

Seat Numbers: ${booking.seat_numbers || '—'}

Total Cost: ${totalCost}

Please arrive at the theatre before show time and present your booking details at entry.

Thank you for choosing our services. Enjoy your movie!

Regards,

CineWave Entertainment Booking Support Team`;
  return { subject, body };
}
