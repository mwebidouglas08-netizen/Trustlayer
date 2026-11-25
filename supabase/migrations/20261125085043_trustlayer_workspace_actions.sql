create function public.save_agreement(p_title text,p_seller text,p_amount text,p_deadline timestamptz,p_terms text,p_id uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if not public.workspace_active() then raise exception 'Active authenticated account required' using errcode='42501'; end if;
 if p_amount !~ '^[1-9][0-9]{0,19}$' or p_deadline <= now() then raise exception 'Invalid amount or deadline'; end if;
 if p_id is null then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.agreements where creator_id=auth.uid() and created_at>now()-interval '1 hour') >= 30 then raise exception 'Hourly agreement limit reached'; end if;
  insert into public.agreements(creator_id,title,seller_wallet,amount_base_units,deadline,terms) values(auth.uid(),trim(p_title),trim(p_seller),p_amount::numeric,p_deadline,trim(p_terms)) returning id into result;
 else
  update public.agreements set title=trim(p_title),seller_wallet=trim(p_seller),amount_base_units=p_amount::numeric,deadline=p_deadline,terms=trim(p_terms) where id=p_id and creator_id=auth.uid() and status='draft' returning id into result;
  if result is null then raise exception 'Draft not found or not editable' using errcode='42501'; end if;
 end if;
 insert into public.agreement_events(agreement_id,actor_id,action) values(result,auth.uid(),'draft_saved');
 return result;
end; $$;
create function public.agreement_action(p_id uuid,p_action text) returns void language plpgsql security definer set search_path = '' as $$
declare a public.agreements;
begin
 if not public.workspace_active() then raise exception 'Active authenticated account required' using errcode='42501'; end if;
 select * into a from public.agreements where id=p_id for update;
 if a.id is null then raise exception 'Agreement unavailable' using errcode='42501'; end if;
 if p_action='propose' and a.creator_id=auth.uid() and a.status='draft' and a.deadline>now() then
  if public.owns_wallet(a.seller_wallet) then raise exception 'The seller must be a counterparty'; end if;
  if not exists(select 1 from public.wallets where user_id=auth.uid() and verified_at is not null) then raise exception 'Verify your own wallet first'; end if;
  update public.agreements set status='proposed' where id=p_id;
 elsif p_action='accept' and a.creator_id<>auth.uid() and a.status='proposed' and a.deadline>now() and public.owns_wallet(a.seller_wallet) then
  update public.agreements set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=p_id;
 elsif p_action='cancel' and a.creator_id=auth.uid() and a.status in ('draft','proposed') then
  update public.agreements set status='cancelled' where id=p_id;
 else raise exception 'Action not permitted for this account or agreement state' using errcode='42501'; end if;
 insert into public.agreement_events(agreement_id,actor_id,action) values(p_id,auth.uid(),p_action);
end; $$;
create function public.issue_wallet_challenge(p_key text) returns table(id uuid,message text) language plpgsql security definer set search_path = '' as $$
declare challenge uuid := gen_random_uuid(); msg text;
begin
 if not public.workspace_active() then raise exception 'Active authenticated account required' using errcode='42501'; end if;
 if p_key !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' then raise exception 'Invalid public key'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 if (select count(*) from public.wallet_challenges where user_id=auth.uid() and created_at>now()-interval '5 minutes') >= 10 then raise exception 'Too many challenges. Try again later.'; end if;
 msg := 'Trustlayer wallet verification' || chr(10) || 'Origin: https://web-xi-nine-d4ej5g61wk.vercel.app' || chr(10) || 'Account: ' || auth.uid()::text || chr(10) || 'Wallet: ' || p_key || chr(10) || 'Nonce: ' || challenge::text || chr(10) || 'Issued: ' || now()::text || chr(10) || 'Expires in five minutes. This signature does not authorize payments.';
 insert into public.wallet_challenges(id,user_id,public_key,message,expires_at) values(challenge,auth.uid(),p_key,msg,now()+interval '5 minutes');
 return query select challenge,msg;
end; $$;
-- Only the Edge Function service role may consume a cryptographically verified challenge.
create function public.complete_wallet_challenge(p_id uuid,p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
declare c public.wallet_challenges;
begin
 select * into c from public.wallet_challenges where id=p_id and user_id=p_user and consumed_at is null and expires_at>now() for update;
 if c.id is null then raise exception 'Expired or already used challenge'; end if;
 if not exists(select 1 from public.profiles where id=p_user and account_status='active') then raise exception 'Account unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(c.public_key,2));
 if exists(select 1 from public.wallets where public_key=c.public_key and user_id<>p_user) then raise exception 'Wallet already linked to a different account'; end if;
 insert into public.wallets(user_id,public_key,cluster,verified_at,verification_method) values(p_user,c.public_key,'devnet',now(),'ed25519_challenge') on conflict(public_key) do update set verified_at=excluded.verified_at,verification_method=excluded.verification_method where public.wallets.user_id=excluded.user_id;
 if not found then raise exception 'Wallet is unavailable'; end if;
 update public.wallet_challenges set consumed_at=now() where id=p_id;
 insert into public.audit_logs(actor_user_id,actor_role,action,resource_type,resource_id) values(p_user,'user','wallet_verified','wallet',c.public_key);
end; $$;
revoke all on function public.save_agreement(text,text,text,timestamptz,text,uuid),public.agreement_action(uuid,text),public.issue_wallet_challenge(text),public.complete_wallet_challenge(uuid,uuid) from public,anon,authenticated;
grant execute on function public.save_agreement(text,text,text,timestamptz,text,uuid),public.agreement_action(uuid,text),public.issue_wallet_challenge(text) to authenticated;
grant execute on function public.complete_wallet_challenge(uuid,uuid) to service_role;
