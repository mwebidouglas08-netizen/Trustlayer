begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(15);
select ok(not has_column_privilege('authenticated', 'public.profiles', 'account_status', 'UPDATE'), 'cannot self-reactivate profile');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'account_status', 'INSERT'), 'cannot insert privileged status');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), 'can update own display name subject to RLS');
select ok(not has_table_privilege('authenticated', 'public.wallets', 'INSERT'), 'cannot reserve an unverified wallet');
select ok(not has_column_privilege('authenticated', 'public.wallets', 'verified_at', 'UPDATE'), 'cannot self-verify wallet');
select ok(not has_column_privilege('authenticated', 'public.transactions', 'state_mirror', 'UPDATE'), 'cannot forge chain state');
select ok(not has_table_privilege('anon', 'public.transactions', 'SELECT'), 'anonymous users cannot read database transactions');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'SELECT'), 'audit logs are not exposed to user sessions');
select ok((select relrowsecurity from pg_class where oid = 'public.transactions'::regclass), 'transaction RLS enabled');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'wallets' and cmd in ('INSERT', 'UPDATE')), 0, 'no wallet write policies');
-- Verify real row isolation as the authenticated role, not only policy metadata.
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'buyer@test.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'outsider@test.invalid');
insert into public.profiles (id, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'Buyer'),
  ('22222222-2222-4222-8222-222222222222', 'Outsider');
insert into public.transactions (public_reference, creator_user_id, title, transaction_type, amount_base_units, token_mint, cluster, program_id)
values ('test-reference', '11111111-1111-4111-8111-111111111111', 'Test', 'goods', 1, 'test-mint', 'devnet', 'test-program');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is((select count(*)::int from public.profiles), 1, 'only own profile is visible');
select is((select count(*)::int from public.transactions), 1, 'creator can read own transaction');
select lives_ok($$update public.profiles set display_name = 'New name' where id = '11111111-1111-4111-8111-111111111111'$$, 'allowlisted own profile edit works');
select throws_ok($$update public.profiles set account_status = 'active' where id = '11111111-1111-4111-8111-111111111111'$$, '42501', null, 'privileged status writes fail');
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is((select count(*)::int from public.transactions), 0, 'unrelated authenticated user cannot read the transaction');
reset role;
select * from finish();
rollback;
