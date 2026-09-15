CREATE TABLE IF NOT EXISTS birthday_destination_choice (
  singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
  destination TEXT NOT NULL CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama')),
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
