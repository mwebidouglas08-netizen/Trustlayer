-- Wallet-first release does not use a database state mirror. Keep writes server-only.
-- RLS controls rows; explicit column grants control user-editable fields.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name, business_name, avatar_path, country_code, preferred_currency) on public.profiles to authenticated;
grant update (display_name, business_name, avatar_path, country_code, preferred_currency) on public.profiles to authenticated;

drop policy if exists wallets_insert_own on public.wallets;
drop policy if exists wallets_update_own on public.wallets;
revoke all on public.wallets from anon;
revoke insert, update, delete on public.wallets from authenticated;
grant select on public.wallets to authenticated;
-- Do not re-enable writes until a server implements single-use, expiring signature challenges.

revoke all on public.transactions from anon;
revoke insert, update, delete on public.transactions from authenticated;
grant select on public.transactions to authenticated;
create policy transactions_select_participant on public.transactions for select to authenticated
  using (auth.uid() = creator_user_id or auth.uid() = buyer_user_id or auth.uid() = seller_user_id);
revoke all on public.audit_logs from anon, authenticated;

alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active', 'suspended', 'closed'));
alter table public.wallets add constraint wallets_cluster_check check (cluster in ('devnet', 'testnet', 'mainnet-beta'));
create unique index wallets_one_primary on public.wallets(user_id, cluster) where is_primary;
alter table public.transactions add constraint transactions_amount_u64 check (amount_base_units <= 18446744073709551615);
alter table public.transactions add constraint transactions_dispute_window_positive check (dispute_window_seconds > 0);
alter table public.transactions add constraint transactions_distinct_participants check (buyer_user_id is null or seller_user_id is null or buyer_user_id <> seller_user_id);

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.touch_updated_at();
