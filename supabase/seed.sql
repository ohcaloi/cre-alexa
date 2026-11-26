-- Development fixtures for an isolated project. Do not execute against production.
insert into public.community_records(kind,slug,title,description,published,minimum_level,sort_order)
values
 ('venue','sample-meeting-room','Sample meeting room','Development fixture for testing venue navigation.',true,0,10),
 ('venue','sample-conference-suite','Sample conference suite','Development fixture for testing venue navigation.',true,0,20),
 ('article','sample-welcome','Welcome to the community','Development fixture for the public article list.',true,0,10),
 ('article','sample-member-guide','Member guide','Development fixture for testing premium content access.',true,2,20)
on conflict (kind,slug) do nothing;

insert into public.community_records(kind,slug,title,description,starts_at,capacity,venue_id,published)
select 'event','sample-community-meetup','Sample community meetup','Development-only event fixture.',
       now()+interval '14 days',20,v.id,true
from public.community_records v where v.kind='venue' and v.slug='sample-meeting-room'
on conflict (kind,slug) do nothing;
