alter table public.agreements add column amount_text text generated always as (amount_base_units::text) stored;
alter table public.profiles add constraint profile_display_name_length check (display_name is null or char_length(display_name) <= 80);
alter table public.profiles add constraint profile_business_name_length check (business_name is null or char_length(business_name) <= 160);
create function public.record_agreement_file() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.agreement_events(agreement_id,actor_id,action) values(new.agreement_id,new.uploaded_by,'file_added'); return new; end; $$;
revoke all on function public.record_agreement_file() from public,anon,authenticated;
create trigger agreement_file_event after insert on public.agreement_files for each row execute function public.record_agreement_file();
