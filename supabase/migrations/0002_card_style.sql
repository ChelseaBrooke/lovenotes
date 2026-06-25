-- Poem stationery: stores the chosen paper / font / ink / frame preset ids
-- for poem cards as a small JSON blob. Null for non-poem cards.
alter table public.cards add column if not exists style jsonb;
