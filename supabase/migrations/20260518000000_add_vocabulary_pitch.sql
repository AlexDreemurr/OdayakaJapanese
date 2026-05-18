alter table public.vocabulary
  add column if not exists pitch integer;

alter table public.vocabulary
  drop constraint if exists vocabulary_pitch_non_negative;

alter table public.vocabulary
  add constraint vocabulary_pitch_non_negative
  check (pitch is null or pitch >= 0);
