CREATE TABLE browser_sessions (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX browser_sessions_expiry ON browser_sessions (expires_at);

CREATE TABLE saved_words (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES browser_sessions(id) ON DELETE CASCADE,
  word text NOT NULL CHECK (char_length(word) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX saved_words_owner_word ON saved_words (session_id, lower(word));
CREATE INDEX saved_words_owner_created ON saved_words (session_id, created_at, id);

CREATE TABLE saved_profiles (
  session_id uuid NOT NULL REFERENCES browser_sessions(id) ON DELETE CASCADE,
  github_id text NOT NULL CHECK (github_id ~ '^[1-9][0-9]{0,19}$'),
  login text NOT NULL CHECK (char_length(login) BETWEEN 1 AND 39),
  avatar_url text NOT NULL CHECK (char_length(avatar_url) BETWEEN 1 AND 2048),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, github_id)
);
CREATE INDEX saved_profiles_owner_created ON saved_profiles (session_id, created_at, github_id);

CREATE TABLE todos (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES browser_sessions(id) ON DELETE CASCADE,
  item text NOT NULL CHECK (char_length(item) BETWEEN 1 AND 500),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX todos_owner_created ON todos (session_id, created_at, id);
