CREATE TABLE IF NOT EXISTS birthday_destination_choice (
  singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
  destination TEXT NOT NULL CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama')),
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birthday_mural_messages (
  id BIGSERIAL PRIMARY KEY,
  author TEXT NOT NULL CHECK (char_length(trim(author)) BETWEEN 1 AND 80),
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS birthday_mural_messages_created_at_idx
  ON birthday_mural_messages (created_at DESC);
