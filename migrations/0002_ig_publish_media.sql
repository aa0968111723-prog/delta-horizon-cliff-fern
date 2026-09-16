-- Short-lived frames so Instagram can fetch a public https image_url.
-- Unowned, no user_id, TTL enforced in application code. Not a media library.
create table if not exists ig_publish_media (
  id         text primary key,
  mime       text not null,
  bytes      bytea not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ig_publish_media_expires_idx on ig_publish_media (expires_at);
