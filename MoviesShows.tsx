import { useEffect, useState } from 'react';
import { Film, Plus, Clapperboard, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Movie, Show, ShowType } from '@/lib/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { FieldWrapper, Input, Select, Textarea } from '@/components/Field';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

export function MoviesShows() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieModal, setMovieModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

  async function load() {
    setLoading(true);
    const [m, s] = await Promise.all([
      supabase.from('movies').select('*').order('movie_name'),
      supabase.from('shows').select('*').order('show_date, show_time'),
    ]);
    setMovies((m.data || []) as Movie[]);
    setShows((s.data || []) as Show[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteMovie(id: string) {
    if (!confirm('Delete this movie? All related shows will also be removed.')) return;
    await supabase.from('movies').delete().eq('id', id);
    await load();
  }

  async function deleteShow(id: string) {
    if (!confirm('Delete this show?')) return;
    await supabase.from('shows').delete().eq('id', id);
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Movies & Shows</h1>
        <p className="text-sm text-slate-500">Manage the reusable Movie and Show data objects used by booking requests.</p>
      </div>

      {/* Movies */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Film className="h-5 w-5 text-sky-500" /> Movies
          </h2>
          <Button onClick={() => { setEditingMovie(null); setMovieModal(true); }}>
            <Plus className="h-4 w-4" /> Add Movie
          </Button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : movies.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <EmptyState icon={<Film className="h-6 w-6" />} title="No movies yet" description="Add your first movie to create shows." />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {movies.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                      <Film className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.movie_name}</p>
                      <p className="text-xs text-slate-500">{m.genre} · {m.language} · {m.duration} min</p>
                    </div>
                  </div>
                </div>
                {m.description && <p className="mt-3 text-xs text-slate-500 line-clamp-2">{m.description}</p>}
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" onClick={() => { setEditingMovie(m); setMovieModal(true); }} className="px-2 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" onClick={() => deleteMovie(m.id)} className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Clapperboard className="h-5 w-5 text-sky-500" /> Shows
          </h2>
          <Button onClick={() => { setEditingShow(null); setShowModal(true); }} disabled={movies.length === 0}>
            <Plus className="h-4 w-4" /> Add Show
          </Button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : shows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <EmptyState icon={<Clapperboard className="h-6 w-6" />} title="No shows yet" description={movies.length === 0 ? 'Add a movie first, then create a show.' : 'Add your first show.'} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Movie</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Theatre</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.movie_name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(s.show_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(s.show_time)}</td>
                    <td className="px-4 py-3"><Badge variant={s.show_type === 'Premium' ? 'premium' : 'info'}>{s.show_type}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.theatre_name} {s.screen_name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.available_seats_count}/{s.seat_capacity}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(s.ticket_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingShow(s); setShowModal(true); }} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteShow(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {movieModal && (
        <MovieModal
          movie={editingMovie}
          onClose={() => setMovieModal(false)}
          onSaved={() => { setMovieModal(false); load(); }}
        />
      )}
      {showModal && (
        <ShowModal
          show={editingShow}
          movies={movies}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function MovieModal({ movie, onClose, onSaved }: { movie: Movie | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(movie?.movie_name || '');
  const [genre, setGenre] = useState(movie?.genre || '');
  const [language, setLanguage] = useState(movie?.language || 'English');
  const [duration, setDuration] = useState(movie?.duration?.toString() || '');
  const [description, setDescription] = useState(movie?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError('Movie name is required.'); return; }
    setSaving(true);
    setError(null);
    const payload = {
      movie_name: name.trim(),
      genre: genre.trim() || null,
      language: language.trim() || null,
      duration: duration ? parseInt(duration, 10) : null,
      description: description.trim() || null,
    };
    let err;
    if (movie) {
      ({ error: err } = await supabase.from('movies').update(payload).eq('id', movie.id));
    } else {
      ({ error: err } = await supabase.from('movies').insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={movie ? 'Edit Movie' : 'Add Movie'}>
      <div className="space-y-4">
        <FieldWrapper label="Movie Name" required error={error && !name.trim() ? error : undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galactic Odyssey" />
        </FieldWrapper>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Genre">
            <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Sci-Fi" />
          </FieldWrapper>
          <FieldWrapper label="Language">
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" />
          </FieldWrapper>
        </div>
        <FieldWrapper label="Duration (minutes)">
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="120" />
        </FieldWrapper>
        <FieldWrapper label="Description">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short synopsis…" />
        </FieldWrapper>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={save} loading={saving}>{movie ? 'Save Changes' : 'Add Movie'}</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function ShowModal({ show, movies, onClose, onSaved }: { show: Show | null; movies: Movie[]; onClose: () => void; onSaved: () => void }) {
  const [movieId, setMovieId] = useState(show?.movie_id || '');
  const [showDate, setShowDate] = useState(show?.show_date || '');
  const [showTime, setShowTime] = useState(show?.show_time?.slice(0, 5) || '');
  const [showType, setShowType] = useState<ShowType>(show?.show_type || 'Standard');
  const [theatre, setTheatre] = useState(show?.theatre_name || 'CineWave Grand');
  const [screen, setScreen] = useState(show?.screen_name || '');
  const [capacity, setCapacity] = useState(show?.seat_capacity?.toString() || '120');
  const [available, setAvailable] = useState(show?.available_seats_count?.toString() || '120');
  const [price, setPrice] = useState(show?.ticket_price?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!movieId) { setError('Please select a movie.'); return; }
    if (!showDate || !showTime) { setError('Show date and time are required.'); return; }
    setSaving(true);
    setError(null);
    const movie = movies.find((m) => m.id === movieId);
    const payload = {
      movie_id: movieId,
      movie_name: movie?.movie_name || null,
      show_date: showDate,
      show_time: showTime + ':00',
      show_type: showType,
      theatre_name: theatre.trim() || null,
      screen_name: screen.trim() || null,
      seat_capacity: parseInt(capacity, 10) || 0,
      available_seats_count: parseInt(available, 10) || 0,
      ticket_price: parseFloat(price) || 0,
    };
    let err;
    if (show) {
      ({ error: err } = await supabase.from('shows').update(payload).eq('id', show.id));
    } else {
      ({ error: err } = await supabase.from('shows').insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={show ? 'Edit Show' : 'Add Show'}>
      <div className="space-y-4">
        <FieldWrapper label="Movie" required error={error && !movieId ? error : undefined}>
          <Select value={movieId} onChange={(e) => setMovieId(e.target.value)}>
            <option value="">Select a movie…</option>
            {movies.map((m) => <option key={m.id} value={m.id}>{m.movie_name}</option>)}
          </Select>
        </FieldWrapper>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Show Date" required>
            <Input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label="Show Time" required>
            <Input type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} />
          </FieldWrapper>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Show Type" required>
            <Select value={showType} onChange={(e) => setShowType(e.target.value as ShowType)}>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Ticket Price ($)" required>
            <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12.00" />
          </FieldWrapper>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Theatre Name">
            <Input value={theatre} onChange={(e) => setTheatre(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label="Screen Name">
            <Input value={screen} onChange={(e) => setScreen(e.target.value)} placeholder="Screen 1" />
          </FieldWrapper>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Seat Capacity">
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label="Available Seats">
            <Input type="number" min={0} value={available} onChange={(e) => setAvailable(e.target.value)} />
          </FieldWrapper>
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={save} loading={saving}>{show ? 'Save Changes' : 'Add Show'}</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
