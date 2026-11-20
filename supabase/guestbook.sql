-- OLIVE 방명록 테이블 (Supabase > SQL Editor 에 붙여 넣고 Run)
create table if not exists public.guestbook (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(btrim(name)) between 1 and 20),
  message    text not null check (char_length(btrim(message)) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

-- 누구나 읽기 / 쓰기 가능, 수정·삭제는 불가 (삭제는 Supabase 대시보드에서 관리자가 직접)
drop policy if exists "guestbook read"   on public.guestbook;
drop policy if exists "guestbook insert" on public.guestbook;
create policy "guestbook read"   on public.guestbook for select to anon using (true);
create policy "guestbook insert" on public.guestbook for insert to anon with check (true);

grant select, insert on public.guestbook to anon;
