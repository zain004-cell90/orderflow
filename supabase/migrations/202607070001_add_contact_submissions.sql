create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  source text not null default 'contact_page',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx on public.contact_submissions (status);
create index if not exists contact_submissions_email_idx on public.contact_submissions (lower(email));

drop trigger if exists set_contact_submissions_updated_at on public.contact_submissions;
create trigger set_contact_submissions_updated_at
before update on public.contact_submissions
for each row execute function public.set_updated_at();

alter table public.contact_submissions enable row level security;

drop policy if exists "contact submissions public insert" on public.contact_submissions;
drop policy if exists "contact submissions admin select" on public.contact_submissions;
drop policy if exists "contact submissions admin update" on public.contact_submissions;
drop policy if exists "contact submissions admin delete" on public.contact_submissions;

create policy "contact submissions public insert"
on public.contact_submissions
for insert
to public
with check (true);

create policy "contact submissions admin select"
on public.contact_submissions
for select
to authenticated
using (public.is_admin());

create policy "contact submissions admin update"
on public.contact_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "contact submissions admin delete"
on public.contact_submissions
for delete
to authenticated
using (public.is_admin());

revoke all on public.contact_submissions from anon, authenticated;
grant insert on public.contact_submissions to anon, authenticated;
grant select, update, delete on public.contact_submissions to authenticated;
