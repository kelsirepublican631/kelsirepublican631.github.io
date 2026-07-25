-- =============================================================================
-- The Swatch Book — Schema v4 / Phase 6: AI Fabric Matching
-- Run this AFTER schema.sql, schema_v2_phase0.sql, and schema_v3_phase4.sql,
-- once, in your Supabase project's SQL Editor.
--
-- IMPORTANT CONTEXT before running this: as of Phase 6's implementation,
-- the product catalog has NO real fabric photos — only flat hex swatch
-- colors (see `fabrics.hex` from schema.sql). SigLIP embeddings are only
-- as useful as the photos feeding them; a hex swatch has no texture,
-- weave, or lighting information for a visual model to learn from. This
-- schema and the matching pipeline built on it are real and functional,
-- but will not outperform the existing Delta-E color matching until real
-- fabric photos are actually uploaded per product. See README.
--
-- What this adds:
--   - fabrics.photo_url        a real product photo (separate from `hex`,
--                               which stays as the calibrated swatch color
--                               used for the storefront and Delta-E math)
--   - fabric_embeddings         one row per fabric, storing an AI visual
--                               embedding + which model/provider produced
--                               it, so the model is swappable later
--                               (SigLIP today, DINOv2 or newer tomorrow)
--                               without changing the rest of the app
--   - match_feedback             which suggested match a merchant actually
--                               picked, for a given search — used to
--                               evaluate/improve ranking quality later
--
-- Design notes:
--   - Embeddings are stored as a plain `float8[]` column, not pgvector.
--     At this shop's scale (thousands of products, not millions),
--     brute-force cosine similarity computed in the app is fast enough —
--     consistent with the "don't overbuild for this scale" decision made
--     earlier in this project. Revisit only if the catalog grows by
--     orders of magnitude.
--   - Product photos reuse the same private-Storage-bucket pattern as
--     Phase 2's customer-request photos, for consistency.
-- =============================================================================

alter table fabrics add column if not exists photo_url text;
comment on column fabrics.photo_url is 'Real fabric photo for AI visual matching (Phase 6). Separate from hex, which is the calibrated swatch color used for Delta-E matching and storefront display.';

-- fabrics_secure (from schema.sql) is what the app actually reads from
-- (see src/lib/supabaseApi.js), not the base fabrics table — so photo_url
-- needs to be added there too, or the app will never see it even though
-- the column exists. This re-creates the view exactly as in schema.sql,
-- with photo_url added to the selected columns; the wholesale_price
-- column-security logic is untouched.
create or replace view fabrics_secure
with (security_invoker = true) as
select
  id, fabric_type, color_name, hex, width, gsm, retail_price, stock_meters, sku, created_at, photo_url,
  case when is_wholesale_authorized() then wholesale_price else null end as wholesale_price
from fabrics;

create table if not exists fabric_embeddings (
  id uuid primary key default gen_random_uuid(),
  fabric_id uuid not null references fabrics(id) on delete cascade,
  model text not null,             -- e.g. 'siglip-base-patch16-224' — identifies which model produced this vector, so a future model change doesn't silently mix incompatible embeddings
  embedding float8[] not null,
  created_at timestamptz not null default now(),
  unique (fabric_id, model)         -- one embedding per fabric per model version; re-embedding with a new model adds a new row rather than overwriting history
);

create index if not exists idx_fabric_embeddings_fabric on fabric_embeddings(fabric_id);

alter table fabric_embeddings enable row level security;

create policy "fabric_embeddings_staff_only" on fabric_embeddings
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid())
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid())
  );

create table if not exists match_feedback (
  id uuid primary key default gen_random_uuid(),
  query_photo_url text,             -- the customer/staff swatch photo that was searched
  selected_fabric_id uuid references fabrics(id) on delete set null,
  selected_rank integer,            -- 1 = top suggestion was picked, 2 = second, etc. — useful for judging ranking quality over time
  ai_score numeric,                 -- the hybrid score the selected match had, for later analysis
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table match_feedback enable row level security;

create policy "match_feedback_staff_only" on match_feedback
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid())
  )
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid())
  );

-- Storage bucket for fabric product photos (separate from Phase 2's
-- customer-request-photos bucket, since these are catalog data, not
-- transient request records).
insert into storage.buckets (id, name, public)
select 'fabric-photos', 'fabric-photos', false
where not exists (select 1 from storage.buckets where id = 'fabric-photos');

create policy "fabric_photos_staff_write" on storage.objects
  for insert with check (
    bucket_id = 'fabric-photos'
    and exists (select 1 from profiles where profiles.id = auth.uid())
  );

create policy "fabric_photos_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'fabric-photos'
    and exists (select 1 from profiles where profiles.id = auth.uid())
  );

-- Fabric photos are readable by anyone (not staff-only like customer
-- request photos) since they're meant to show on the storefront/matcher
-- results, similar to how `hex` is already public via fabrics_secure.
create policy "fabric_photos_public_read" on storage.objects
  for select using (bucket_id = 'fabric-photos');
