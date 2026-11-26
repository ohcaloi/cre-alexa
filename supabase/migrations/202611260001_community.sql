create table public.community_profiles (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  display_name text not null check (length(display_name) between 1 and 120),
  job_title text not null default '' check (length(job_title) <= 120),
  company text not null default '' check (length(company) <= 120),
  biography text not null default '' check (length(biography) <= 4000),
  experience text not null default '' check (length(experience) <= 4000),
  website text not null default '' check (length(website) <= 500),
  contact_email text not null default '' check (length(contact_email) <= 254),
  notifications boolean not null default false
);
create table public.community_admins (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('manager', 'editor', 'moderator'))
);
create table public.community_plans (
  code text primary key check (code in ('standard','premium','sponsor')),
  title text not null,
  level smallint not null unique check (level between 1 and 3),
  benefits text[] not null default '{}',
  stripe_price text unique,
  price_label text not null default '',
  enabled boolean not null default true
);
insert into public.community_plans (code,title,level,benefits) values
 ('standard','Standard',1,array['Member profile','Résumé management','Vendor application eligibility']),
 ('premium','Premium',2,array['Standard benefits','Premium events and articles']),
 ('sponsor','Sponsor',3,array['Premium benefits','Sponsor profile']);
create table public.community_memberships (
  user_id uuid primary key references auth.users on delete cascade,
  plan_code text not null references public.community_plans,
  status text not null check (status in ('active','inactive','past_due','canceled')),
  expires_at timestamptz not null,
  stripe_customer text unique,
  stripe_subscription text unique,
  updated_at timestamptz not null default now()
);
create table public.community_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event','article','venue','sponsor')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 180),
  description text not null default '' check (length(description) <= 12000),
  image_url text,
  address text,
  website text,
  owner_id uuid references auth.users on delete set null,
  venue_id uuid references public.community_records on delete set null,
  starts_at timestamptz,
  capacity integer check (capacity > 0),
  sort_order integer not null default 0,
  minimum_level smallint not null default 0 check (minimum_level between 0 and 3),
  published boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind,slug)
);
create index community_records_listing on public.community_records(kind,published,sort_order,starts_at);
create table public.community_registrations (
  event_id uuid not null references public.community_records on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key(event_id,user_id)
);
create index community_registration_owner on public.community_registrations(user_id);
create table public.community_parking (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.community_records on delete cascade,
  title text not null,
  address text not null,
  fees text,
  unique(venue_id,title)
);
create table public.community_vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 150),
  category text not null check (length(category) between 1 and 100),
  description text not null check (length(description) between 1 and 5000),
  website text,
  location text,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','approved','rejected','refunded')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index community_vendors_owner on public.community_vendor_applications(user_id);
create table public.community_payments (
  stripe_id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  vendor_id uuid references public.community_vendor_applications on delete set null,
  amount integer not null check (amount >= 0),
  currency text not null,
  status text not null check (status in ('paid','refunded')),
  created_at timestamptz not null default now()
);
create index community_payments_owner on public.community_payments(user_id);
create table public.community_webhook_events (
  id text primary key,
  created_at timestamptz not null default now()
);
create table public.community_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users on delete set null,
  action text not null,
  target uuid,
  created_at timestamptz not null default now()
);

create function public.community_admin(required_role text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal' = 'aal2',false) and exists (
    select 1 from public.community_admins where user_id = auth.uid()
    and (required_role is null or role in ('manager',required_role))
  )
$$;
create function public.community_level(member uuid default auth.uid()) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.level from public.community_memberships m
   join public.community_plans p on p.code=m.plan_code
   where m.user_id=member and m.status='active' and m.expires_at>now()),0)
$$;
revoke execute on function public.community_level(uuid) from public,anon,authenticated;
create function public.community_my_level() returns integer
language sql stable security definer set search_path = '' as $$
  select public.community_level(auth.uid())
$$;

alter table public.community_profiles enable row level security;
alter table public.community_admins enable row level security;
alter table public.community_plans enable row level security;
alter table public.community_memberships enable row level security;
alter table public.community_records enable row level security;
alter table public.community_registrations enable row level security;
alter table public.community_parking enable row level security;
alter table public.community_vendor_applications enable row level security;
alter table public.community_payments enable row level security;
alter table public.community_webhook_events enable row level security;
alter table public.community_audit enable row level security;

create policy profile_read on public.community_profiles for select to authenticated using (id=auth.uid() or public.community_admin('manager'));
create policy profile_insert on public.community_profiles for insert to authenticated with check (id=auth.uid());
create policy profile_update on public.community_profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy own_role on public.community_admins for select to authenticated using (user_id=auth.uid());
create policy plans_read on public.community_plans for select using (enabled or public.community_admin('manager'));
create policy plan_manage on public.community_plans for update to authenticated using (public.community_admin('manager')) with check (public.community_admin('manager'));
create policy membership_read on public.community_memberships for select to authenticated using (user_id=auth.uid() or public.community_admin('manager'));
create policy record_read on public.community_records for select using (
  (published and (expires_at is null or expires_at>now()) and minimum_level<=public.community_my_level())
  or public.community_admin('editor')
);
create policy record_manage on public.community_records for all to authenticated using (public.community_admin('editor')) with check (public.community_admin('editor'));
create policy parking_read on public.community_parking for select using (exists (
  select 1 from public.community_records v where v.id=venue_id and v.kind='venue'
));
create policy parking_manage on public.community_parking for all to authenticated using (public.community_admin('editor')) with check (public.community_admin('editor'));
create policy registration_read on public.community_registrations for select to authenticated using (user_id=auth.uid() or public.community_admin('editor'));
create policy vendor_read on public.community_vendor_applications for select to authenticated using (user_id=auth.uid() or public.community_admin('moderator'));
create policy vendor_insert on public.community_vendor_applications for insert to authenticated with check (
  user_id=auth.uid() and public.community_my_level()>0 and status='pending_payment' and expires_at is null
);
create policy payment_read on public.community_payments for select to authenticated using (user_id=auth.uid() or public.community_admin('manager'));
create policy audit_read on public.community_audit for select to authenticated using (public.community_admin('manager'));

revoke all on public.community_vendor_applications from anon,authenticated;
grant select,insert on public.community_vendor_applications to authenticated;
revoke all on public.community_memberships, public.community_payments,
 public.community_registrations, public.community_audit, public.community_admins,
 public.community_webhook_events from anon,authenticated;
grant select on public.community_memberships,public.community_payments,
 public.community_registrations,public.community_audit,public.community_admins to authenticated;

grant select on public.community_plans,public.community_records,public.community_parking to anon,authenticated;
revoke all on public.community_profiles from anon;
grant select,insert,update on public.community_profiles to authenticated;
grant update on public.community_plans to authenticated;
grant insert,update,delete on public.community_records,public.community_parking to authenticated;

create function public.community_public_vendors(search text default '', requested_category text default '', page_offset integer default 0, requested_slug text default '')
returns table(slug text,name text,category text,description text,website text,location text)
language sql stable security definer set search_path = '' as $$
  select v.slug,v.name,v.category,v.description,v.website,v.location
  from public.community_vendor_applications v
  where v.status='approved' and v.expires_at>now() and public.community_level(v.user_id)>0
    and (requested_slug='' or v.slug=requested_slug)
    and (requested_category='' or v.category=requested_category)
    and (search='' or strpos(lower(v.name || ' ' || v.description),lower(left(search,120)))>0)
  order by v.name,v.slug limit 21 offset greatest(0,least(page_offset,10000))
$$;

create function public.community_register(event uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare item public.community_records;
begin
  if auth.uid() is null then return false; end if;
  select * into item from public.community_records where id=event and kind='event' for update;
  if not found or not item.published or item.starts_at is null or item.starts_at<=now()
    or (item.expires_at is not null and item.expires_at<=now())
    or item.minimum_level>public.community_level(auth.uid()) then return false; end if;
  if exists(select 1 from public.community_registrations where event_id=event and user_id=auth.uid()) then return true; end if;
  if item.capacity is not null and item.capacity<=(select count(*) from public.community_registrations where event_id=event) then return false; end if;
  insert into public.community_registrations(event_id,user_id) values(event,auth.uid());
  return true;
end $$;
revoke execute on function public.community_register(uuid) from public,anon;
grant execute on function public.community_register(uuid) to authenticated;

create function public.community_moderate_vendor(application uuid, approved boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.community_admin('moderator') then return false; end if;
  update public.community_vendor_applications
    set status=case when approved then 'approved' else 'rejected' end,
        expires_at=case when approved then now()+interval '1 year' else null end
    where id=application and status='paid' and (not approved or public.community_level(user_id)>0);
  if not found then return false; end if;
  insert into public.community_audit(actor,action,target) values(auth.uid(),case when approved then 'vendor.approved' else 'vendor.rejected' end,application);
  return true;
end $$;
revoke execute on function public.community_moderate_vendor(uuid,boolean) from public,anon;
grant execute on function public.community_moderate_vendor(uuid,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('community-resumes','community-resumes',false,5242880,array['application/pdf']),
 ('community-avatars','community-avatars',false,2097152,array['image/jpeg','image/png']);
create policy community_private_file_reads on storage.objects for select to authenticated
 using (bucket_id in ('community-resumes','community-avatars') and (storage.foldername(name))[1]=auth.uid()::text);
