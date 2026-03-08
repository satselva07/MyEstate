-- Run this in Supabase SQL Editor

create extension if not exists btree_gist;

create table if not exists public.properties (
  id text primary key,
  name text not null,
  city text not null,
  price_per_night numeric not null,
  address text,
  facilities text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(id) on delete cascade,
  guest_name text not null,
  guest_phone text not null,
  guest_email text not null,
  check_in date not null,
  check_out date not null,
  notes text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  constraint booking_date_order check (check_in < check_out)
);

-- Prevent overlapping active bookings for same property
alter table public.bookings
  drop constraint if exists bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    property_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending','confirmed'));

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.booked_ranges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references public.bookings(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  status text not null check (status in ('pending','confirmed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_booked_ranges_property_dates
on public.booked_ranges (property_id, check_in, check_out);

create or replace function public.sync_booked_ranges()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.booked_ranges where booking_id = old.id;
    return old;
  end if;

  if (new.status in ('pending','confirmed')) then
    insert into public.booked_ranges (booking_id, property_id, check_in, check_out, status)
    values (new.id, new.property_id, new.check_in, new.check_out, new.status)
    on conflict (booking_id)
    do update set
      property_id = excluded.property_id,
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      status = excluded.status;
  else
    delete from public.booked_ranges where booking_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_booked_ranges on public.bookings;
create trigger trg_sync_booked_ranges
after insert or update or delete on public.bookings
for each row execute function public.sync_booked_ranges();

insert into public.booked_ranges (booking_id, property_id, check_in, check_out, status)
select id, property_id, check_in, check_out, status
from public.bookings
where status in ('pending','confirmed')
on conflict (booking_id)
do update set
  property_id = excluded.property_id,
  check_in = excluded.check_in,
  check_out = excluded.check_out,
  status = excluded.status;

alter table public.properties enable row level security;
alter table public.bookings enable row level security;
alter table public.inquiries enable row level security;
alter table public.booked_ranges enable row level security;

-- Public read properties
drop policy if exists "public read properties" on public.properties;
create policy "public read properties"
on public.properties for select
to anon
using (true);

-- Public can create booking requests
drop policy if exists "public insert bookings" on public.bookings;
create policy "public insert bookings"
on public.bookings for insert
to anon
with check (true);

-- Public can create inquiries
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries"
on public.inquiries for insert
to anon
with check (true);

-- Public can read non-sensitive availability data
drop policy if exists "public read booked ranges" on public.booked_ranges;
create policy "public read booked ranges"
on public.booked_ranges for select
to anon
using (true);

-- Optional: authenticated admins can read data in Supabase dashboard/API
drop policy if exists "auth read bookings" on public.bookings;
create policy "auth read bookings"
on public.bookings for select
to authenticated
using (true);

drop policy if exists "auth update bookings status" on public.bookings;
create policy "auth update bookings status"
on public.bookings for update
to authenticated
using (true)
with check (status in ('pending','confirmed','cancelled'));

drop policy if exists "auth read inquiries" on public.inquiries;
create policy "auth read inquiries"
on public.inquiries for select
to authenticated
using (true);

-- Seed your properties
insert into public.properties (id, name, city, price_per_night, address, facilities)
values
  ('p1', 'Radha Illam', 'Chennai', 4500, 'VJD''s Mitra, 22, EB Colony 2nd St, Vel Nagar, Radha Nagar, Adambakkam, Chennai, Tamil Nadu 600042', array['2 Bedrooms','WiFi','Private Parking','Kitchen']),
  ('p2', 'Neithal Homes', 'Puducherry', 7500, 'No.31 Nehru bazzar Chinnasubbrayapillai street, Puducherry, 605001', array['2 Bedrooms','WiFi','Kitchen','Family Friendly']),
  ('p3', 'Marutham Farms', 'Puducherry', 4500, 'Ariyankuppam, Puducherry', array['Farm Stay','2 Bedrooms','WiFi','Parking']),
  ('p4', 'Kurunji Retreat', 'Kodaikkanal', 15000, 'Pethuparai Village, Villpatti, Kodaikkanal', array['3 Bedrooms','Mountain View','WiFi','Parking'])
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  price_per_night = excluded.price_per_night,
  address = excluded.address,
  facilities = excluded.facilities;
