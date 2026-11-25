-- Executed on the connected project. All test identities and records are rolled back.
-- Requires an operator SQL connection. Does NOT exercise Ed25519 (see Edge handler tests).
begin;
create temp table test_accounts (label text, id uuid default gen_random_uuid(), wallet text);
insert into test_accounts(label,wallet) values ('buyer',repeat('1',32)),('seller',repeat('2',43)),('outsider',repeat('3',43));
insert into auth.users(id,email) select id, id::text || '@test.invalid' from test_accounts;
insert into public.wallets(user_id,public_key,cluster,verified_at,verification_method) select id,wallet,'devnet',now(),'transaction_rollback_test_fixture' from test_accounts where label in ('buyer','seller');
grant select on test_accounts to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from test_accounts where label='buyer'),true);
select set_config('test.agreement_id',public.save_agreement('Permission regression', (select wallet from test_accounts where label='seller'),'12500000',now()+interval '2 days','Immutable terms used only in a rolled back regression test',null)::text,true);
do $$ begin
 if (select count(*) from public.agreements where id=current_setting('test.agreement_id')::uuid) <> 1 then raise exception 'Buyer cannot read own draft'; end if;
 begin update public.profiles set account_status='active' where id=auth.uid(); raise exception 'Privileged profile write unexpectedly succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.complete_wallet_challenge(gen_random_uuid(),auth.uid()); raise exception 'Client can self-verify'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from test_accounts where label='seller'),true);
do $$ begin if (select count(*) from public.agreements where id=current_setting('test.agreement_id')::uuid) <> 0 then raise exception 'Seller can read unpublished draft'; end if; end $$;
select set_config('request.jwt.claim.sub',(select id::text from test_accounts where label='buyer'),true);
select public.agreement_action(current_setting('test.agreement_id')::uuid,'propose');
select set_config('request.jwt.claim.sub',(select id::text from test_accounts where label='outsider'),true);
do $$ begin
 if (select count(*) from public.agreements where id=current_setting('test.agreement_id')::uuid) <> 0 then raise exception 'Outsider can read agreement'; end if;
 begin perform public.agreement_action(current_setting('test.agreement_id')::uuid,'accept'); raise exception 'Outsider acceptance succeeded'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from test_accounts where label='seller'),true);
select public.agreement_action(current_setting('test.agreement_id')::uuid,'accept');
do $$ begin
 if (select status from public.agreements where id=current_setting('test.agreement_id')::uuid) <> 'accepted' then raise exception 'Acceptance did not persist'; end if;
 begin update public.agreements set terms='Tampered terms' where id=current_setting('test.agreement_id')::uuid; raise exception 'Direct update succeeded'; exception when insufficient_privilege then null; end;
 if not public.can_read_agreement(current_setting('test.agreement_id')::uuid) then raise exception 'Accepted participant cannot read'; end if;
end $$;
reset role;
do $$ begin
 if exists(select 1 from storage.buckets where id='trustlayer-evidence' and public) then raise exception 'Evidence bucket is public'; end if;
 if has_table_privilege('anon','public.agreements','SELECT') then raise exception 'Anonymous read grant exists'; end if;
 if (select count(*) from public.agreement_events where agreement_id=current_setting('test.agreement_id')::uuid)<>3 then raise exception 'Audit events missing'; end if;
end $$;
select 'PASS: authenticated draft, private invitation, acceptance, audit events, outsider rejection, sensitive grants, private bucket. All fixture data rolled back.' as verification;
rollback;
