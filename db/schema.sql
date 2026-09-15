CREATE TABLE IF NOT EXISTS birthday_destination_choice (
  singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
  destination TEXT NOT NULL CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama')),
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birthday_mural_messages (
  id BIGSERIAL PRIMARY KEY,
  author TEXT NOT NULL CHECK (char_length(trim(author)) BETWEEN 1 AND 80),
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 500),
  note_x NUMERIC(6, 3) NOT NULL DEFAULT 8,
  note_y NUMERIC(6, 3) NOT NULL DEFAULT 8,
  image_data_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE birthday_mural_messages
  ADD COLUMN IF NOT EXISTS note_x NUMERIC(6, 3) NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS note_y NUMERIC(6, 3) NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS image_data_url TEXT;

CREATE INDEX IF NOT EXISTS birthday_mural_messages_created_at_idx
  ON birthday_mural_messages (created_at DESC);
