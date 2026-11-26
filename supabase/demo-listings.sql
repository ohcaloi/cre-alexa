-- Fictional listings and non-login test identities for CRE Alexa Staging only.
-- Apply separately from migrations. Never apply this file to production.
begin;

insert into auth.users (id)
values ('fa615000-0000-4000-8000-000000000001'), ('fa615000-0000-4000-8000-000000000002'), ('fa615000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

insert into public.community_memberships (user_id, plan_code, status, expires_at)
values
  ('fa615000-0000-4000-8000-000000000001', 'standard', 'active', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000002', 'premium', 'active', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000003', 'sponsor', 'active', now() + interval '1 year')
on conflict (user_id) do nothing;

insert into public.community_records
  (kind, slug, title, description, address, published, minimum_level, sort_order)
values
  ('venue', 'demo-cre-alexa-venue-01', 'Juniper Exchange', 'Flexible meeting rooms with a separate breakout space.', 'Nashville, TN', true, 0, 30),
  ('venue', 'demo-cre-alexa-venue-02', 'Copper Bend Conference Suite', 'A main conference room and two smaller breakout spaces.', 'Austin, TX', true, 0, 31),
  ('venue', 'demo-cre-alexa-venue-03', 'Cumberland Foundry Hall', 'An industrial-style panel venue with an adjoining reception area.', 'Nashville, TN', true, 0, 32),
  ('venue', 'demo-cre-alexa-venue-04', 'Mesa Crossing Pavilion', 'A covered mixer venue with space for check-in and a short speaker program.', 'Austin, TX', true, 0, 33),
  ('venue', 'demo-cre-alexa-venue-05', 'Eastbank Workshop Loft', 'A loft with movable tables for workshops and small group discussions.', 'Nashville, TN', true, 0, 34),
  ('venue', 'demo-cre-alexa-venue-06', 'Cedar Row Terrace', 'An open-air terrace with both standing and seated reception layouts.', 'Austin, TX', true, 0, 35),
  ('venue', 'demo-cre-alexa-venue-07', 'Grove Street Commons', 'A bright neighborhood room for presentations and community conversations.', 'Nashville, TN', true, 0, 36),
  ('venue', 'demo-cre-alexa-venue-08', 'Willowline Boardroom', 'A compact boardroom for peer roundtables and planning sessions.', 'Austin, TX', true, 0, 37),
  ('venue', 'demo-cre-alexa-venue-09', 'Station House Forum', 'A theater-style room for panel discussions and audience Q&A.', 'Nashville, TN', true, 0, 38),
  ('venue', 'demo-cre-alexa-venue-10', 'Sagebrush Meeting Studio', 'A flexible training studio with collaborative tables.', 'Austin, TX', true, 0, 39),
  ('venue', 'demo-cre-alexa-venue-11', 'Riverside Briefing Room', 'A compact venue for advisory meetings and project presentations.', 'Nashville, TN', true, 0, 40),
  ('venue', 'demo-cre-alexa-venue-12', 'Bluebonnet Exchange Hall', 'A larger hall with room for registration and sponsor displays.', 'Austin, TX', true, 0, 41),
  ('venue', 'demo-cre-alexa-venue-13', 'Oakhaven Assembly', 'A reception room with standing and seated areas.', 'Nashville, TN', true, 0, 42),
  ('venue', 'demo-cre-alexa-venue-14', 'Twin Oaks Seminar Room', 'A classroom-style room for educational workshops.', 'Austin, TX', true, 0, 43),
  ('venue', 'demo-cre-alexa-venue-15', 'Harpeth Courtyard', 'An outdoor courtyard for daytime mixers and sponsor receptions.', 'Nashville, TN', true, 0, 44),
  ('venue', 'demo-cre-alexa-venue-16', 'Limestone Lookout', 'An indoor-to-outdoor layout for informal networking and talks.', 'Austin, TX', true, 0, 45),
  ('venue', 'demo-cre-alexa-venue-17', 'Maple Yard Meeting House', 'A meeting house with an informal breakout space.', 'Nashville, TN', true, 0, 46),
  ('venue', 'demo-cre-alexa-venue-18', 'Highland Workroom', 'A workshop room with presenter space and collaborative tables.', 'Austin, TX', true, 0, 47),
  ('venue', 'demo-cre-alexa-venue-19', 'Arrowleaf Reception Hall', 'A reception venue with a flexible floor plan.', 'Nashville, TN', true, 0, 48),
  ('venue', 'demo-cre-alexa-venue-20', 'Paloma Commons', 'A central room for committees, peer conversations, or a small mixer.', 'Austin, TX', true, 0, 49)
on conflict (kind, slug) do nothing;

insert into public.community_parking (venue_id, title, address, fees)
select id, 'Example on-site lot', address, 'Example only'
from public.community_records
where kind = 'venue' and slug = 'demo-cre-alexa-venue-01'
on conflict (venue_id, title) do nothing;

insert into public.community_vendor_applications
  (user_id, slug, name, category, description, location, services, status, expires_at)
values
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-01', 'Alderline Property Imaging', 'Photography', 'Property photography, walkthrough images, and event coverage.', 'Nashville, TN', 'Property photography, walkthrough images, and event coverage.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-02', 'Juniper Grid Engineering', 'Engineering', 'Building systems reviews and mechanical planning.', 'Austin, TX', 'Building systems reviews and mechanical planning.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-03', 'Clearspan Tenant Advisors', 'Brokerage', 'Tenant requirements and space comparisons.', 'Nashville, TN', 'Tenant requirements and space comparisons.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-04', 'Signal Yard IT', 'Technology', 'Wi-Fi planning, meeting room technology, and on-site support.', 'Austin, TX', 'Wi-Fi planning, meeting room technology, and on-site support.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-05', 'Copperleaf Space Planning', 'Architecture', 'Test fits and conceptual workplace layouts.', 'Nashville, TN', 'Test fits and conceptual workplace layouts.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-06', 'Brazos Ledger Services', 'Accounting', 'Property bookkeeping and expense reconciliation.', 'Austin, TX', 'Property bookkeeping and expense reconciliation.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-07', 'Cumberland Wayfinding', 'Signage', 'Property identification, wayfinding, and temporary event signs.', 'Nashville, TN', 'Property identification, wayfinding, and temporary event signs.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-08', 'Mesa Works Buildout', 'Construction', 'Renovation estimates and interior build-out coordination.', 'Austin, TX', 'Renovation estimates and interior build-out coordination.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-09', 'Harpeth Facilities Desk', 'Property operations', 'Maintenance schedules and vendor coordination.', 'Nashville, TN', 'Maintenance schedules and vendor coordination.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-10', 'Paloma Energy Review', 'Sustainability', 'Utility benchmarking and energy-efficiency reviews.', 'Austin, TX', 'Utility benchmarking and energy-efficiency reviews.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-11', 'Birchline Risk Partners', 'Insurance', 'Risk reviews and insurance documentation support.', 'Nashville, TN', 'Risk reviews and insurance documentation support.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-12', 'Westward Site Mapping', 'Surveying', 'Site maps, field measurements, and project documentation.', 'Austin, TX', 'Site maps, field measurements, and project documentation.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-13', 'Greenway Grounds Studio', 'Landscaping', 'Commercial landscape design and maintenance planning.', 'Nashville, TN', 'Commercial landscape design and maintenance planning.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-14', 'Longspur Event Works', 'Event services', 'Event setup, registration, and audiovisual coordination.', 'Austin, TX', 'Event setup, registration, and audiovisual coordination.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-15', 'Eastbank Lease Support', 'Legal services', 'Lease document organization and transaction support.', 'Nashville, TN', 'Lease document organization and transaction support.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-16', 'Sagebrush Asset Data', 'Technology', 'Asset inventory setup and reporting dashboards.', 'Austin, TX', 'Asset inventory setup and reporting dashboards.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-17', 'Orchard Key Security', 'Security', 'Access control reviews and entry planning.', 'Nashville, TN', 'Access control reviews and entry planning.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-18', 'Limestone Moving Services', 'Relocation', 'Commercial moves and move-day coordination.', 'Austin, TX', 'Commercial moves and move-day coordination.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-19', 'Broadleaf Capital Research', 'Finance', 'Market comparisons and preliminary deal analysis.', 'Nashville, TN', 'Market comparisons and preliminary deal analysis.', 'approved', now() + interval '1 year'),
  ('fa615000-0000-4000-8000-000000000001', 'demo-cre-alexa-vendor-20', 'Twin Oaks Cleaning Co', 'Janitorial', 'Routine commercial cleaning and post-event turnaround.', 'Austin, TX', 'Routine commercial cleaning and post-event turnaround.', 'approved', now() + interval '1 year')
on conflict (slug) do nothing;

insert into public.community_records
  (kind, slug, title, description, category, sponsor_tier, owner_id, published, minimum_level, sort_order)
values
  ('sponsor', 'demo-cre-alexa-sponsor-01', 'Fieldstone Development Group', 'A fictional development company used to preview a public sponsor profile.', 'Development', 'Chapter Partner', 'fa615000-0000-4000-8000-000000000003', true, 0, 1),
  ('sponsor', 'demo-cre-alexa-sponsor-02', 'River Arch Capital', 'A fictional finance company used to preview a public sponsor profile.', 'Finance', 'Event Sponsor', null, true, 0, 2),
  ('sponsor', 'demo-cre-alexa-sponsor-03', 'Cedarline Property Partners', 'A fictional property management company used to preview a public sponsor profile.', 'Property management', 'Supporting Sponsor', null, true, 0, 3),
  ('sponsor', 'demo-cre-alexa-sponsor-04', 'Horizon Bend Builders', 'A fictional construction company used to preview a public sponsor profile.', 'Construction', 'Chapter Partner', null, true, 0, 4),
  ('sponsor', 'demo-cre-alexa-sponsor-05', 'Juniper Ridge Design', 'A fictional architecture company used to preview a public sponsor profile.', 'Architecture', 'Event Sponsor', null, true, 0, 5),
  ('sponsor', 'demo-cre-alexa-sponsor-06', 'Signal Hill Workplace', 'A fictional workplace services company used to preview a public sponsor profile.', 'Workplace services', 'Supporting Sponsor', null, true, 0, 6),
  ('sponsor', 'demo-cre-alexa-sponsor-07', 'Clear Creek Commercial', 'A fictional brokerage company used to preview a public sponsor profile.', 'Brokerage', 'Chapter Partner', null, true, 0, 7),
  ('sponsor', 'demo-cre-alexa-sponsor-08', 'Aster Grove Insurance', 'A fictional insurance company used to preview a public sponsor profile.', 'Insurance', 'Event Sponsor', null, true, 0, 8),
  ('sponsor', 'demo-cre-alexa-sponsor-09', 'Limestone Ledger Group', 'A fictional accounting company used to preview a public sponsor profile.', 'Accounting', 'Supporting Sponsor', null, true, 0, 9),
  ('sponsor', 'demo-cre-alexa-sponsor-10', 'Northmark Building Systems', 'A fictional engineering company used to preview a public sponsor profile.', 'Engineering', 'Chapter Partner', null, true, 0, 10),
  ('sponsor', 'demo-cre-alexa-sponsor-11', 'Mesa Verde Advisory', 'A fictional consulting company used to preview a public sponsor profile.', 'Consulting', 'Event Sponsor', null, true, 0, 11),
  ('sponsor', 'demo-cre-alexa-sponsor-12', 'Bracken Hill Interiors', 'A fictional interiors company used to preview a public sponsor profile.', 'Interiors', 'Supporting Sponsor', null, true, 0, 12),
  ('sponsor', 'demo-cre-alexa-sponsor-13', 'Oak Crossing Title Group', 'A fictional title services company used to preview a public sponsor profile.', 'Title services', 'Chapter Partner', null, true, 0, 13),
  ('sponsor', 'demo-cre-alexa-sponsor-14', 'Copper Rail Engineering', 'A fictional engineering company used to preview a public sponsor profile.', 'Engineering', 'Event Sponsor', null, true, 0, 14),
  ('sponsor', 'demo-cre-alexa-sponsor-15', 'Parkline Access Systems', 'A fictional security company used to preview a public sponsor profile.', 'Security', 'Supporting Sponsor', null, true, 0, 15),
  ('sponsor', 'demo-cre-alexa-sponsor-16', 'Willow Harbor Planning', 'A fictional planning company used to preview a public sponsor profile.', 'Planning', 'Chapter Partner', null, true, 0, 16),
  ('sponsor', 'demo-cre-alexa-sponsor-17', 'Pecan Trail Event Group', 'A fictional event services company used to preview a public sponsor profile.', 'Event services', 'Event Sponsor', null, true, 0, 17),
  ('sponsor', 'demo-cre-alexa-sponsor-18', 'Ridgeline Environmental', 'A fictional sustainability company used to preview a public sponsor profile.', 'Sustainability', 'Supporting Sponsor', null, true, 0, 18),
  ('sponsor', 'demo-cre-alexa-sponsor-19', 'Harpeth Glassworks', 'A fictional construction company used to preview a public sponsor profile.', 'Construction', 'Chapter Partner', null, true, 0, 19),
  ('sponsor', 'demo-cre-alexa-sponsor-20', 'Paloma Market Research', 'A fictional research company used to preview a public sponsor profile.', 'Research', 'Event Sponsor', null, true, 0, 20)
on conflict (kind, slug) do nothing;

insert into public.community_records
  (kind, slug, title, description, published, minimum_level, starts_at, capacity)
values
  ('article', 'demo-cre-alexa-standard-guide', 'Standard member orientation', 'Sample resource visible to all active members.', true, 1, null, null),
  ('article', 'demo-cre-alexa-premium-brief', 'Premium market brief', 'Sample resource for Premium and Sponsor members.', true, 2, null, null),
  ('event', 'demo-cre-alexa-premium-roundtable', 'Premium member roundtable', 'Sample private event for Premium and Sponsor members.', true, 2, now() + interval '30 days', 25),
  ('article', 'demo-cre-alexa-sponsor-guide', 'Sponsor onboarding guide', 'Sample resource visible at Sponsor level.', true, 3, null, null)
on conflict (kind, slug) do nothing;

commit;
