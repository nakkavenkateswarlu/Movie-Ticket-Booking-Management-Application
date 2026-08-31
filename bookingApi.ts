import { supabase } from './supabase';
import type {
  Booking,
  BookingConfirmationStatus,
  CaseStage,
  Movie,
  SeatAvailabilityStatus,
  Show,
  WorkQueue,
} from './types';
import { generateSeatNumbers, generateTicketId, shortCaseId } from './utils';

export interface NewBookingInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  movie_id: string;
  show_id: string;
  number_of_tickets: number;
  show_type: 'Premium' | 'Standard';
}

/**
 * Create a new Movie Ticket Request case in the Initial stage.
 * Pulls movie + show data to populate denormalized case fields.
 */
export async function createBooking(input: NewBookingInput): Promise<Booking> {
  // Fetch movie + show
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', input.movie_id)
    .maybeSingle<Movie>();

  const { data: show } = await supabase
    .from('shows')
    .select('*')
    .eq('id', input.show_id)
    .maybeSingle<Show>();

  if (!movie || !show) {
    throw new Error('Selected movie or show could not be found.');
  }

  const totalCost = Number(show.ticket_price) * input.number_of_tickets;
  const slaGoalAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
  const slaDeadlineAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const insertPayload = {
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    customer_phone: input.customer_phone,
    movie_id: movie.id,
    movie_name: movie.movie_name,
    genre: movie.genre,
    show_id: show.id,
    show_date: show.show_date,
    show_time: show.show_time,
    show_type: input.show_type,
    number_of_tickets: input.number_of_tickets,
    ticket_price: Number(show.ticket_price),
    total_cost: totalCost,
    available_seats_count: show.available_seats_count,
    booking_confirmation_status: 'Pending' as BookingConfirmationStatus,
    stage: 'Initial' as CaseStage,
    sla_goal_at: slaGoalAt,
    sla_deadline_at: slaDeadlineAt,
    urgency: 0,
    customer_confirmed: false,
    email_sent: false,
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert(insertPayload)
    .select()
    .single<Booking>();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create booking request.');
  }
  return data;
}

/**
 * Availability stage: verify seat availability against requested tickets.
 * Sets Seat Availability Status and advances or blocks accordingly.
 */
export async function verifyAvailability(bookingId: string): Promise<Booking> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle<Booking>();

  if (!booking) throw new Error('Booking not found.');

  // Re-fetch the show's current available seats for fresh data
  const { data: show } = await supabase
    .from('shows')
    .select('available_seats_count, ticket_price')
    .eq('id', booking.show_id)
    .maybeSingle<Pick<Show, 'available_seats_count' | 'ticket_price'>>();

  const availableSeats = show?.available_seats_count ?? booking.available_seats_count;
  const ticketPrice = show?.ticket_price != null ? Number(show.ticket_price) : booking.ticket_price;
  const enough = availableSeats >= booking.number_of_tickets;
  const status: SeatAvailabilityStatus = enough ? 'Available' : 'Not Available';
  const totalCost = ticketPrice * booking.number_of_tickets;

  const nextStage: CaseStage = enough ? 'Approval' : 'Availability';

  const { data, error } = await supabase
    .from('bookings')
    .update({
      seat_availability_status: status,
      available_seats_count: availableSeats,
      ticket_price: ticketPrice,
      total_cost: totalCost,
      stage: nextStage,
    })
    .eq('id', bookingId)
    .select()
    .single<Booking>();

  if (error || !data) throw new Error(error?.message || 'Failed to verify availability.');
  return data;
}

/**
 * Customer cancels from Approval stage. Resolves case as Cancelled, no email.
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      booking_confirmation_status: 'Cancelled',
      customer_confirmed: false,
      stage: 'Resolved',
      resolution_status: 'Cancelled',
    })
    .eq('id', bookingId)
    .in('stage', ['Availability', 'Approval'])
    .select()
    .maybeSingle<Booking>();

  if (error) throw new Error(error?.message || 'Failed to cancel booking.');
  if (!data) throw new Error('Booking could not be cancelled (it may already be resolved).');
  return data;
}

/**
 * Customer confirms in Approval. Advances to Booking Execution and routes to work queue.
 */
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle<Booking>();

  if (!booking) throw new Error('Booking not found.');
  if (booking.stage !== 'Approval') throw new Error('Booking is not in the Approval stage.');

  // Re-verify seat availability before proceeding
  const { data: show } = await supabase
    .from('shows')
    .select('available_seats_count')
    .eq('id', booking.show_id)
    .maybeSingle<Pick<Show, 'available_seats_count'>>();

  const available = show?.available_seats_count ?? booking.available_seats_count;
  if (available < booking.number_of_tickets) {
    await supabase
      .from('bookings')
      .update({
        seat_availability_status: 'Not Available',
        available_seats_count: available,
      })
      .eq('id', bookingId);
    throw new Error('Insufficient seats available. Booking cannot proceed.');
  }

  const workQueue: WorkQueue = booking.show_type === 'Premium' ? 'PremiumShowQueue' : 'StandardShowQueue';

  const { data, error } = await supabase
    .from('bookings')
    .update({
      customer_confirmed: true,
      customer_confirmed_at: new Date().toISOString(),
      stage: 'Booking Execution',
      seat_availability_status: 'Available',
      available_seats_count: available,
      work_queue: workQueue,
    })
    .eq('id', bookingId)
    .select()
    .single<Booking>();

  if (error || !data) throw new Error(error?.message || 'Failed to confirm booking.');
  return data;
}

/**
 * Booking Execution: allocate seats, generate ticket id, mark confirmed, update show,
 * resolve case, and send confirmation correspondence.
 */
export async function executeBooking(bookingId: string): Promise<Booking> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle<Booking>();

  if (!booking) throw new Error('Booking not found.');
  if (booking.stage !== 'Booking Execution') throw new Error('Booking is not in Booking Execution.');
  if (!booking.customer_confirmed) throw new Error('Customer confirmation is required before booking execution.');

  // Final seat re-verification
  const { data: show } = await supabase
    .from('shows')
    .select('available_seats_count, seat_capacity')
    .eq('id', booking.show_id)
    .maybeSingle<Pick<Show, 'available_seats_count' | 'seat_capacity'>>();

  const available = show?.available_seats_count ?? booking.available_seats_count;
  if (available < booking.number_of_tickets) {
    throw new Error('Insufficient seats available at execution time. Booking cannot be completed.');
  }

  const ticketId = generateTicketId();
  const seatsAllocated = booking.number_of_tickets;
  // seat numbers: continue from (capacity - available + 1)
  const startFrom = (show?.seat_capacity ?? available) - available + 1;
  const seatNumbers = generateSeatNumbers(seatsAllocated, startFrom);
  const newAvailableCount = available - seatsAllocated;

  // Atomically update show available seats
  const { error: showErr } = await supabase
    .from('shows')
    .update({ available_seats_count: newAvailableCount })
    .eq('id', booking.show_id);

  if (showErr) throw new Error('Failed to update show seat count.');

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      seat_numbers: seatNumbers,
      ticket_id: ticketId,
      booking_confirmation_status: 'Confirmed',
      stage: 'Resolved',
      resolution_status: 'Confirmed',
      available_seats_count: newAvailableCount,
    })
    .eq('id', bookingId)
    .select()
    .single<Booking>();

  if (error || !updated) throw new Error(error?.message || 'Failed to execute booking.');

  // Send automated confirmation correspondence
  await sendConfirmationEmail(updated);

  return updated;
}

/**
 * Build and store the confirmation email, mark email_sent on the case.
 */
async function sendConfirmationEmail(booking: Booking): Promise<void> {
  const caseId = shortCaseId(booking.id);
  const subject = `Movie Ticket Booking Confirmed - ${caseId}`;
  const showDateTime = `${booking.show_date} ${booking.show_time}`;
  const totalCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(booking.total_cost);

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

  await supabase.from('correspondence').insert({
    booking_id: booking.id,
    case_id: caseId,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    subject,
    body,
  });

  await supabase.from('bookings').update({ email_sent: true }).eq('id', booking.id);
}
