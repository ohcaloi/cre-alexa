alter policy parking_read on public.community_parking
using (exists (
  select 1
  from public.community_records as venue
  where venue.id = community_parking.venue_id
    and venue.kind = 'venue'
));
