import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("community PostgreSQL policies and billing transitions", async (t) => {
  const db = await PGlite.create();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    grant all on storage.objects to anon,authenticated;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  `);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(file, migrations), "utf8"));
  }
  const owner = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  const editor = "00000000-0000-4000-8000-000000000003";
  const vendor = "00000000-0000-4000-8000-000000000004";
  const event = "00000000-0000-4000-8000-000000000005";
  await db.query("insert into auth.users values ($1),($2),($3)",[owner,other,editor]);
  await db.query("insert into community_admins values ($1,'manager')",[editor]);
  await db.query("insert into community_memberships(user_id,plan_code,status,expires_at) values ($1,'standard','active',now()+interval '2 days'),($2,'premium','active',now()+interval '2 days')",[owner,other]);
  await db.query("insert into community_records(id,kind,slug,title,published,minimum_level,starts_at,capacity) values ($1,'event','public-event','Public event',true,0,now()+interval '1 day',1)",[event]);
  await db.exec("insert into community_records(kind,slug,title,published,minimum_level) values ('article','premium','Private content',true,2)");
  const sponsorId = "00000000-0000-4000-8000-000000000006";
  await db.query("insert into community_records(id,kind,slug,title,owner_id) values($1,'sponsor','sponsor','Sponsor',$2)",[sponsorId,other]);
  await db.query("insert into storage.objects(bucket_id,name) values('community-resumes',$1)",[`${owner}/current`]);
  async function as(role, user, aal = "aal1") {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:user,aal})]);
    await db.exec(`set role ${role}`);
  }
  const scalar = async (sql, bind = []) => Object.values((await db.query(sql,bind)).rows[0])[0];
  await as("anon");
  assert.equal(await scalar("select count(*) from community_records where slug='premium'"),0);
  await assert.rejects(db.query("select id from community_profiles"));
  await as("authenticated",owner);
  assert.equal(await scalar("select count(*) from community_records where slug='premium'"),0);
  assert.equal(await scalar("select community_register($1)",[event]),true);
  assert.equal(await scalar("select community_register($1)",[event]),true);
  await db.query("insert into community_profiles(display_name) values ('Owner')");
  assert.equal(await scalar("select count(*) from storage.objects"),1);
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('community-resumes',$1)",[`${owner}/unchecked`]));
  await db.query("insert into community_vendor_applications(id,slug,name,category,description) values ($1,'vendor','Vendor','Service','Description')",[vendor]);
  await assert.rejects(db.query("insert into community_vendor_applications(slug,name,category,description,featured) values ('featured','Bad','Service','Description',true)"));
  await assert.rejects(db.query("update community_vendor_applications set status='approved' where id=$1",[vendor]));
  await assert.rejects(db.query("select community_apply_billing('forged',1,'{}'::jsonb)"));
  assert.equal(await scalar("select community_edit_sponsor($1,'Unauthorized','','','{}')",[sponsorId]),false);
  await as("authenticated",other);
  assert.equal(await scalar("select count(*) from community_profiles"),0);
  assert.equal(await scalar("select count(*) from storage.objects"),0);
  assert.equal(await scalar("select count(*) from community_records where slug='premium'"),1);
  assert.equal(await scalar("select community_register($1)",[event]),false);
  assert.equal(await scalar("select community_edit_sponsor($1,'Premium is insufficient','','','{}')",[sponsorId]),false);
  await db.exec("reset role");
  await db.query("update community_memberships set plan_code='sponsor' where user_id=$1",[other]);
  await as("authenticated",other);
  assert.equal(await scalar("select community_edit_sponsor($1,'Sponsor-managed description','','','{}')",[sponsorId]),true);
  await as("service_role");
  const payload = {type:"vendor_paid",user:owner,vendor,payment:"pi_1",amount:6500,currency:"usd"};
  await db.query("select community_apply_billing('evt_paid',1,$1)",[payload]);
  await db.query("select community_apply_billing('evt_paid',1,$1)",[payload]);
  assert.equal(await scalar("select count(*) from community_payments"),1);
  await as("authenticated",editor);
  assert.equal(await scalar("select community_moderate_vendor($1,true)",[vendor]),false);
  await as("authenticated",editor,"aal2");
  assert.equal(await scalar("select community_moderate_vendor($1,true)",[vendor]),true);
  assert.equal(await scalar("select vendor_amount from community_finance_totals()"),6500);
  await as("anon");
  assert.equal(await scalar("select count(*) from community_public_vendors()"),1);
  await as("service_role");
  await db.query("select community_apply_billing('evt_refund',2,$1)",[{...payload,type:"vendor_refunded"}]);
  await db.query("select community_apply_billing('evt_delayed',1,$1)",[payload]);
  await as("anon");
  assert.equal(await scalar("select count(*) from community_public_vendors()"),0);

  await db.exec("reset role");
  const demo = await readFile(new URL("../supabase/demo-listings.sql", import.meta.url), "utf8");
  await db.exec(demo);
  await db.exec(demo);
  await db.exec(`
    insert into community_records(kind,slug,title,published,minimum_level)
      values ('venue','premium-venue','Premium venue',true,2), ('venue','draft-venue','Draft venue',false,0);
    insert into community_parking(venue_id,title,address)
      select id, title || ' parking', 'Example address' from community_records where slug in ('premium-venue','draft-venue');
  `);
  await as("anon");
  for (const kind of ["venue", "sponsor"]) {
    assert.equal(await scalar("select count(*) from community_records where kind=$1 and slug like 'demo-cre-alexa-%'",[kind]),20);
  }
  assert.equal(await scalar("select count(*) from community_public_vendors() where slug like 'demo-cre-alexa-%'"),20);
  assert.equal(await scalar("select count(*) from community_parking"),1);

  const demoUser = (level) => `fa615000-0000-4000-8000-00000000000${level}`;
  for (const [level, visible] of [[0,0],[1,1],[2,3],[3,4]]) {
    await as(level ? "authenticated" : "anon", level ? demoUser(level) : undefined);
    assert.equal(await scalar("select community_my_level()"),level);
    assert.equal(await scalar("select count(*) from community_records where kind in ('event','article') and slug like 'demo-cre-alexa-%'"),visible);
    assert.equal(await scalar("select count(*) from community_parking"),level >= 2 ? 2 : 1);
  }
  const ownedSponsor = await scalar("select id from community_records where slug='demo-cre-alexa-sponsor-01'");
  const anotherSponsor = await scalar("select id from community_records where slug='demo-cre-alexa-sponsor-02'");
  assert.equal(await scalar("select community_edit_sponsor($1,'Example update','','','{}')",[ownedSponsor]),true);
  assert.equal(await scalar("select community_edit_sponsor($1,'Example update','','','{}')",[anotherSponsor]),false);
});
