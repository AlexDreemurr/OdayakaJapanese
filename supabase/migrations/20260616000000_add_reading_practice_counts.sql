-- 「看汉字写假名」独立练习记录：与句子填空分开统计，拼对后下次降低优先级
alter table public.vocab_practice
  add column if not exists reading_correct_count integer not null default 0,
  add column if not exists reading_attempt_count integer not null default 0;
