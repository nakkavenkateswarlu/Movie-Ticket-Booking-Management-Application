import { useState } from 'react';
import { Film, LayoutDashboard, Ticket, Clapperboard, Mail, Plus } from 'lucide-react';
import { Dashboard } from '@/views/Dashboard';
import { NewBooking } from '@/views/NewBooking';
import { BookingList } from '@/views/BookingList';
import { BookingDetail } from '@/views/BookingDetail';
import { MoviesShows } from '@/views/MoviesShows';
import { CorrespondenceView } from '@/views/CorrespondenceView';
import type { Booking } from '@/lib/types';

type View =
  | { name: 'dashboard' }
  | { name: 'new-booking' }
  | { name: 'bookings' }
  | { name: 'booking'; id: string }
  | { name: 'movies' }
  | { name: 'correspondence' };

const NAV: { label: string; icon: typeof Film; view: View['name']; roles: string }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard', roles: 'Agent' },
  { label: 'New Booking', icon: Plus, view: 'new-booking', roles: 'Customer' },
  { label: 'Bookings', icon: Ticket, view: 'bookings', roles: 'Agent' },
  { label: 'Movies & Shows', icon: Clapperboard, view: 'movies', roles: 'Agent' },
  { label: 'Correspondence', icon: Mail, view: 'correspondence', roles: 'Agent' },
];

function App() {
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [role, setRole] = useState<'Customer' | 'Booking Agent'>('Booking Agent');

  const navigate = (v: View) => setView(v);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/20">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">CineWave</p>
            <p className="text-xs text-slate-400">Entertainment</p>
          </div>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
          {NAV.filter((n) => n.roles.includes(role === 'Customer' ? 'Customer' : 'Agent')).map((item) => {
            const Icon = item.icon;
            const active = view.name === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate({ name: item.view } as View)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Viewing as</p>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => {
                setRole('Booking Agent');
                setView({ name: 'dashboard' });
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                role === 'Booking Agent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Agent
            </button>
            <button
              onClick={() => {
                setRole('Customer');
                setView({ name: 'new-booking' });
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                role === 'Customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Customer
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-white">
            <Film className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">CineWave</span>
        </div>
        <select
          value={view.name}
          onChange={(e) => navigate({ name: e.target.value } as View)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="dashboard">Dashboard</option>
          <option value="new-booking">New Booking</option>
          <option value="bookings">Bookings</option>
          <option value="movies">Movies & Shows</option>
          <option value="correspondence">Correspondence</option>
        </select>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-6 pt-16 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {view.name === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {view.name === 'new-booking' && <NewBooking onCreated={(b: Booking) => navigate({ name: 'booking', id: b.id })} />}
          {view.name === 'bookings' && <BookingList onOpen={(id: string) => navigate({ name: 'booking', id })} />}
          {view.name === 'booking' && <BookingDetail bookingId={view.id} onBack={() => navigate({ name: 'bookings' })} />}
          {view.name === 'movies' && <MoviesShows />}
          {view.name === 'correspondence' && <CorrespondenceView />}
        </div>
      </main>
    </div>
  );
}

export default App;
