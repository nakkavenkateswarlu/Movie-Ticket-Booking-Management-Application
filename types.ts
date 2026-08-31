export type ShowType = 'Premium' | 'Standard';
export type SeatAvailabilityStatus = 'Available' | 'Not Available';
export type BookingConfirmationStatus = 'Pending' | 'Confirmed' | 'Cancelled';
export type CaseStage = 'Initial' | 'Availability' | 'Approval' | 'Booking Execution' | 'Resolved';
export type ResolutionStatus = 'Confirmed' | 'Cancelled';
export type WorkQueue = 'PremiumShowQueue' | 'StandardShowQueue';

export interface Movie {
  id: string;
  movie_name: string;
  genre: string | null;
  language: string | null;
  duration: number | null;
  description: string | null;
  created_at: string;
}

export interface Show {
  id: string;
  movie_id: string | null;
  movie_name: string | null;
  show_date: string;
  show_time: string;
  show_type: ShowType;
  theatre_name: string | null;
  screen_name: string | null;
  seat_capacity: number;
  available_seats_count: number;
  ticket_price: number;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  movie_id: string | null;
  movie_name: string | null;
  genre: string | null;
  show_id: string | null;
  show_date: string | null;
  show_time: string | null;
  show_type: ShowType | null;
  number_of_tickets: number;
  seat_availability_status: SeatAvailabilityStatus | null;
  available_seats_count: number;
  ticket_price: number;
  total_cost: number;
  seat_numbers: string | null;
  ticket_id: string | null;
  booking_confirmation_status: BookingConfirmationStatus;
  work_queue: WorkQueue | null;
  stage: CaseStage;
  resolution_status: ResolutionStatus | null;
  urgency: number;
  sla_goal_at: string | null;
  sla_deadline_at: string | null;
  customer_confirmed: boolean;
  customer_confirmed_at: string | null;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Correspondence {
  id: string;
  booking_id: string;
  case_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  subject: string | null;
  body: string | null;
  sent_at: string;
}

export const SHOW_TYPES: ShowType[] = ['Premium', 'Standard'];
export const SEAT_AVAILABILITY_VALUES: SeatAvailabilityStatus[] = ['Available', 'Not Available'];
export const BOOKING_STATUS_VALUES: BookingConfirmationStatus[] = ['Pending', 'Confirmed', 'Cancelled'];
export const CASE_STAGES: CaseStage[] = ['Initial', 'Availability', 'Approval', 'Booking Execution', 'Resolved'];
