alter table public.community_memberships add column stripe_event_time bigint not null default 0;

create function public.community_apply_billing(event_key text, event_time bigint, change jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member uuid := (change->>'user')::uuid;
  app uuid := (change->>'vendor')::uuid;
  plan text;
begin
  insert into public.community_webhook_events(id) values(event_key) on conflict do nothing;
  if not found then return; end if;

  if change->>'type' = 'subscription' then
    select code into plan from public.community_plans where stripe_price=change->>'price';
    if plan is null then return; end if;
    insert into public.community_memberships(user_id,plan_code,status,expires_at,stripe_customer,stripe_subscription,stripe_event_time)
    values(member,plan,change->>'status',(change->>'expires')::timestamptz,change->>'customer',change->>'subscription',event_time)
    on conflict (user_id) do update set
      plan_code=excluded.plan_code,status=excluded.status,expires_at=excluded.expires_at,
      stripe_customer=excluded.stripe_customer,stripe_subscription=excluded.stripe_subscription,
      stripe_event_time=excluded.stripe_event_time,updated_at=now()
    where community_memberships.stripe_event_time<=event_time
      and (community_memberships.stripe_subscription=excluded.stripe_subscription
        or community_memberships.status in ('inactive','canceled'));
  elsif change->>'type' in ('vendor_paid','vendor_refunded','invoice_paid') then
    if app is not null and not exists (
      select 1 from public.community_vendor_applications where id=app and user_id=member
    ) then return; end if;
    insert into public.community_payments(stripe_id,user_id,vendor_id,amount,currency,status)
    values(change->>'payment',member,app,(change->>'amount')::integer,change->>'currency',
      case when change->>'type'='vendor_refunded' then 'refunded' else 'paid' end)
    on conflict(stripe_id) do update set status='refunded'
      where excluded.status='refunded';
    if app is not null then
      if change->>'type'='vendor_refunded' then
        update public.community_vendor_applications set status='refunded',expires_at=null where id=app;
      else
        update public.community_vendor_applications set status='paid'
        where id=app and status='pending_payment' and exists (
          select 1 from public.community_payments where stripe_id=change->>'payment' and status='paid'
        );
      end if;
    end if;
  end if;
end $$;
revoke execute on function public.community_apply_billing(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.community_apply_billing(text,bigint,jsonb) to service_role;
