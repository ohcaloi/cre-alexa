alter table public.community_records
  add column gallery text[] not null default '{}' check (cardinality(gallery)<=10),
  add column social_url text, add column sponsor_tier text, add column category text;
alter table public.community_vendor_applications
  add column logo_url text, add column cover_url text, add column social_url text,
  add column services text, add column gallery text[] not null default '{}' check (cardinality(gallery)<=10),
  add column featured boolean not null default false;
drop policy vendor_insert on public.community_vendor_applications;
create policy vendor_insert on public.community_vendor_applications for insert to authenticated with check (
  user_id=auth.uid() and public.community_my_level()>0 and status='pending_payment' and expires_at is null and not featured
);
drop function public.community_public_vendors(text,text,integer,text);
create function public.community_public_vendors(search text default '', requested_category text default '', page_offset integer default 0, requested_slug text default '')
returns table(slug text,name text,category text,description text,website text,location text,logo_url text,cover_url text,social_url text,services text,gallery text[],featured boolean)
language sql stable security definer set search_path = '' as $$
  select v.slug,v.name,v.category,v.description,v.website,v.location,v.logo_url,v.cover_url,v.social_url,v.services,v.gallery,v.featured
  from public.community_vendor_applications v
  where v.status='approved' and v.expires_at>now() and public.community_level(v.user_id)>0
    and (requested_slug='' or v.slug=requested_slug)
    and (requested_category='' or v.category=requested_category)
    and (search='' or strpos(lower(v.name || ' ' || v.description),lower(left(search,120)))>0)
  order by v.featured desc,v.name,v.slug limit 21 offset greatest(0,least(page_offset,10000))
$$;
create function public.community_edit_sponsor(record_id uuid, description_text text, website_url text, social_link text, photo_links text[])
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if public.community_my_level()<3 then return false; end if;
  update public.community_records set description=left(description_text,12000),website=left(website_url,500),
    social_url=left(social_link,500),gallery=photo_links
  where id=record_id and owner_id=auth.uid() and kind='sponsor';
  return found;
end $$;
revoke execute on function public.community_edit_sponsor(uuid,text,text,text,text[]) from public,anon;
grant execute on function public.community_edit_sponsor(uuid,text,text,text,text[]) to authenticated;
create policy own_sponsor_record on public.community_records for select to authenticated using (
  owner_id=auth.uid() and kind='sponsor' and public.community_my_level()>=3
);
create function public.community_finance_totals()
returns table(currency text,membership_amount bigint,vendor_amount bigint)
language sql stable security definer set search_path = '' as $$
  select p.currency, coalesce(sum(amount) filter(where vendor_id is null),0),
    coalesce(sum(amount) filter(where vendor_id is not null),0)
  from public.community_payments p where public.community_admin('manager') and status='paid' group by p.currency
$$;
revoke execute on function public.community_finance_totals() from public,anon;
grant execute on function public.community_finance_totals() to authenticated;

grant update(name,description,category,website,location,services,logo_url,cover_url,social_url,gallery)
  on public.community_vendor_applications to authenticated;
create policy vendor_edit_pending on public.community_vendor_applications for update to authenticated
  using (user_id=auth.uid() and public.community_my_level()>0 and status='pending_payment')
  with check (user_id=auth.uid() and public.community_my_level()>0 and status='pending_payment');
