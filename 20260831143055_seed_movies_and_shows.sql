/*
# Seed initial movies and shows for CineWave

Adds a starter catalog of movies and shows so the booking flow has data to work with.
This is seed data only - no schema changes.
*/

-- Movies
INSERT INTO movies (movie_name, genre, language, duration, description) VALUES
('Galactic Odyssey', 'Sci-Fi', 'English', 148, 'A thrilling journey across the stars as humanity searches for a new home.'),
('The Last Fortress', 'Action', 'English', 132, 'An elite squad defends the last standing city against overwhelming odds.'),
('Whispers in the Rain', 'Romance', 'English', 115, 'Two strangers find love during a rainy week in a coastal town.'),
('Shadow Protocol', 'Thriller', 'English', 128, 'A rogue agent must clear her name before a global conspiracy unfolds.'),
('Laugh Riot', 'Comedy', 'English', 105, 'A stand-up comedian''s life spirals hilariously after a viral mishap.'),
('Mystic Valley', 'Animation', 'English', 98, 'A young hero discovers a hidden valley full of magical creatures.')
ON CONFLICT DO NOTHING;

-- Shows (reference the movies above).
INSERT INTO shows (movie_id, movie_name, show_date, show_time, show_type, theatre_name, screen_name, seat_capacity, available_seats_count, ticket_price)
SELECT m.id, m.movie_name, DATE '2026-09-05', TIME '18:00', 'Premium', 'CineWave Grand', 'Screen 1', 80, 65, 18.50 FROM movies m WHERE m.movie_name = 'Galactic Odyssey'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-05', TIME '21:30', 'Standard', 'CineWave Grand', 'Screen 3', 150, 140, 11.00 FROM movies m WHERE m.movie_name = 'Galactic Odyssey'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-06', TIME '19:00', 'Premium', 'CineWave Grand', 'Screen 2', 80, 80, 18.50 FROM movies m WHERE m.movie_name = 'The Last Fortress'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-06', TIME '16:30', 'Standard', 'CineWave Grand', 'Screen 4', 150, 10, 11.00 FROM movies m WHERE m.movie_name = 'Whispers in the Rain'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-07', TIME '20:00', 'Premium', 'CineWave Grand', 'Screen 1', 80, 55, 18.50 FROM movies m WHERE m.movie_name = 'Shadow Protocol'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-07', TIME '14:00', 'Standard', 'CineWave Grand', 'Screen 5', 150, 120, 11.00 FROM movies m WHERE m.movie_name = 'Laugh Riot'
UNION ALL
SELECT m.id, m.movie_name, DATE '2026-09-08', TIME '11:00', 'Standard', 'CineWave Grand', 'Screen 2', 150, 130, 9.50 FROM movies m WHERE m.movie_name = 'Mystic Valley'
ON CONFLICT DO NOTHING;