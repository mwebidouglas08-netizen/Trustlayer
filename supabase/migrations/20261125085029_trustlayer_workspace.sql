-- Authenticated collaboration is deliberately separate from authoritative chain state.
create function public.workspace_active() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = auth.uid() and account_status = 'active');
$$;
create function public.owns_wallet(address text) returns boolean language sql stable security definer set search_path = '' as $$
 select public.workspace_active() and exists(select 1 from public.wallets where user_id = auth.uid() and public_key = address and verified_at is not null);
$$;
create function public.workspace_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
 begin insert into public.profiles(id, display_name) values (new.id, 'Member') on conflict (id) do nothing; return new; end;
$$;
create trigger workspace_new_user after insert on auth.users for each row execute function public.workspace_new_user();
insert into public.profiles(id, display_name) select id, 'Member' from auth.users on conflict (id) do nothing;
create unique index wallets_unique_identity on public.wallets(public_key);
create table public.agreements (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references auth.users(id),
 seller_wallet text not null check (seller_wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
 title text not null check (char_length(title) between 3 and 160),
 amount_base_units numeric(20,0) not null check (amount_base_units > 0 and amount_base_units <= 18446744073709551615),
 deadline timestamptz not null, terms text not null check (char_length(terms) between 10 and 10000),
 status text not null default 'draft' check(status in ('draft','proposed','accepted','cancelled')),
 accepted_by uuid references auth.users(id), accepted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((status = 'accepted' and accepted_by is not null and accepted_at is not null) or (status <> 'accepted' and accepted_by is null and accepted_at is null))
);
create index agreements_creator on public.agreements(creator_id, created_at desc);
create index agreements_seller on public.agreements(seller_wallet, status);
alter table public.agreements enable row level security;
create function public.can_read_agreement(agreement uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select public.workspace_active() and exists(select 1 from public.agreements a where a.id = agreement and (a.creator_id = auth.uid() or a.accepted_by = auth.uid() or (a.status <> 'draft' and public.owns_wallet(a.seller_wallet))));
$$;
create policy agreements_read on public.agreements for select to authenticated using (public.can_read_agreement(id));
revoke all on public.agreements from anon, authenticated;
grant select on public.agreements to authenticated;
create trigger agreements_updated before update on public.agreements for each row execute function public.touch_updated_at();
create table public.agreement_events (
 id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
 actor_id uuid references auth.users(id), action text not null, created_at timestamptz not null default now()
);
create index agreement_events_parent on public.agreement_events(agreement_id, created_at desc);
alter table public.agreement_events enable row level security;
create policy agreement_events_read on public.agreement_events for select to authenticated using (public.can_read_agreement(agreement_id));
revoke all on public.agreement_events from anon, authenticated;
grant select on public.agreement_events to authenticated;
create table public.agreement_files (
 id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
 uploaded_by uuid not null default auth.uid() references auth.users(id), storage_path text unique not null,
 filename text not null check(char_length(filename) between 1 and 180),
 byte_size integer not null check(byte_size > 0 and byte_size <= 10485760),
 created_at timestamptz not null default now(),
 check (split_part(storage_path,'/',1) = agreement_id::text and split_part(storage_path,'/',2) = uploaded_by::text)
);
create index agreement_files_parent on public.agreement_files(agreement_id);
alter table public.agreement_files enable row level security;
create policy agreement_files_read on public.agreement_files for select to authenticated using (public.can_read_agreement(agreement_id));
create policy agreement_files_insert on public.agreement_files for insert to authenticated with check (uploaded_by = auth.uid() and public.can_read_agreement(agreement_id) and exists(select 1 from storage.objects where bucket_id = 'trustlayer-evidence' and name = storage_path));
revoke all on public.agreement_files from anon, authenticated;
grant select on public.agreement_files to authenticated;
grant insert (agreement_id, storage_path, filename, byte_size) on public.agreement_files to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('trustlayer-evidence','trustlayer-evidence',false,10485760,array['application/pdf','image/png','image/jpeg','text/plain']);
create policy evidence_read on storage.objects for select to authenticated using (bucket_id = 'trustlayer-evidence' and exists(select 1 from public.agreements a where a.id::text = split_part(name,'/',1) and public.can_read_agreement(a.id)));
create policy evidence_insert on storage.objects for insert to authenticated with check (bucket_id = 'trustlayer-evidence' and split_part(name,'/',2) = auth.uid()::text and exists(select 1 from public.agreements a where a.id::text = split_part(name,'/',1) and public.can_read_agreement(a.id)));
-- No overwrite/delete policy: participants cannot silently replace or erase shared evidence.
create table public.wallet_challenges (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 public_key text not null, message text not null, expires_at timestamptz not null, consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index wallet_challenges_user on public.wallet_challenges(user_id, created_at desc);
alter table public.wallet_challenges enable row level security;
revoke all on public.wallet_challenges from anon, authenticated;
revoke all on function public.workspace_active(), public.owns_wallet(text), public.can_read_agreement(uuid), public.workspace_new_user() from public, anon;
grant execute on function public.workspace_active(), public.owns_wallet(text), public.can_read_agreement(uuid) to authenticated;
