-- Executed against the live database with all fixtures rolled back.
-- Service-role completion is exercised directly to test atomicity, not to bypass proof in the app.
begin;
create temp table test_identity(id uuid default gen_random_uuid(), wallet text default repeat('4',43));
insert into test_identity default values;
insert into auth.users(id,email) select id,id::text||'@test.invalid' from test_identity;
grant select on test_identity to authenticated,service_role;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from test_identity),true);
select set_config('test.challenge',(select id::text from public.issue_wallet_challenge((select wallet from test_identity))),true);
select set_config('test.record',public.save_agreement('Exact integer boundary',repeat('5',43),'18446744073709551615',now()+interval '1 day','Precision regression fixture, never a real payment',null)::text,true);
do $$ begin
 if (select amount_text from public.agreements where id=current_setting('test.record')::uuid)<>'18446744073709551615' then raise exception 'Precision lost'; end if;
 if has_table_privilege('authenticated','public.wallet_challenges','SELECT') then raise exception 'Challenges exposed'; end if;
 if has_table_privilege('authenticated','public.agreement_events','INSERT') then raise exception 'Audit forge allowed'; end if;
end $$;
reset role;
set local role service_role;
select public.complete_wallet_challenge(current_setting('test.challenge')::uuid,(select id from test_identity));
do $$ declare rejected boolean:=false; begin
 begin perform public.complete_wallet_challenge(current_setting('test.challenge')::uuid,(select id from test_identity)); exception when others then rejected:=true; end;
 if not rejected then raise exception 'Challenge replay accepted'; end if;
end $$;
reset role;
do $$ begin if (select count(*) from public.wallets where user_id=(select id from test_identity) and verified_at is not null)<>1 then raise exception 'Verified wallet was not stored'; end if; end $$;
select 'PASS: exact u64 text, protected challenge access, no client audit writes, atomic proof completion and replay rejection. Signature validation separately unit-tested; all database fixtures rolled back.' as verification;
rollback;
