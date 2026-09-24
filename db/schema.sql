CREATE TABLE IF NOT EXISTS birthday_destination_choice (
  singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
  destination TEXT NOT NULL CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama', 'Montego Bay', 'Curacao')),
  destinations TEXT[],
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE birthday_destination_choice
  ADD COLUMN IF NOT EXISTS destinations TEXT[];

ALTER TABLE birthday_destination_choice
  DROP CONSTRAINT IF EXISTS birthday_destination_choice_destination_check,
  ADD CONSTRAINT birthday_destination_choice_destination_check
    CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama', 'Montego Bay', 'Curacao'));

UPDATE birthday_destination_choice
SET destinations = ARRAY[destination]
WHERE destinations IS NULL OR cardinality(destinations) = 0;

CREATE TABLE IF NOT EXISTS birthday_destination_gate (
  singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
  passphrase TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO birthday_destination_gate (singleton_key, passphrase)
VALUES (TRUE, 'eduardomirey')
ON CONFLICT (singleton_key) DO NOTHING;

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
