-- Het Dorstige Hengsten Toernooi 2026 - Database Schema

-- Session status enum
CREATE TYPE session_status AS ENUM ('lobby', 'active', 'reveal', 'finished');

-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(6) UNIQUE NOT NULL,
  host_name varchar(100) NOT NULL,
  status session_status NOT NULL DEFAULT 'lobby',
  current_beer int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_code ON sessions(code);

-- Beers table
CREATE TABLE beers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  order_number int NOT NULL,
  brewery varchar(200) NOT NULL,
  beer_name varchar(200) NOT NULL,
  description text NOT NULL DEFAULT '',
  beer_type varchar(100) NOT NULL DEFAULT '',
  revealed boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_beers_session_id ON beers(session_id);

-- Participants table
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_participants_session_id ON participants(session_id);

-- Guesses table
CREATE TABLE guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  beer_id uuid NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
  guessed_beer_id uuid NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
  guessed_beer_type varchar(100),
  rating int CHECK (rating >= 1 AND rating <= 10),
  is_correct boolean GENERATED ALWAYS AS (beer_id = guessed_beer_id) STORED,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, beer_id)
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read all data (session-based access is handled in app)
CREATE POLICY "Anyone can read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON sessions FOR UPDATE USING (true);

CREATE POLICY "Anyone can read beers" ON beers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert beers" ON beers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update beers" ON beers FOR UPDATE USING (true);

CREATE POLICY "Anyone can read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read guesses" ON guesses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guesses" ON guesses FOR INSERT WITH CHECK (true);

-- Enable Realtime on relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE beers;
