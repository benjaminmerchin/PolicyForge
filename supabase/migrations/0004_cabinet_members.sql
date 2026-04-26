-- Per-cabinet member overrides. When a cabinet has a "members" JSONB, those
-- names/titles/initials replace the default fictional archetypes for the
-- corresponding agent roles (pm, economy, justice, ecology, tech). Opposition
-- Shadow and Citizen Simulator remain cabinet-agnostic.

alter table public.cabinets add column if not exists members jsonb;

-- Reagan administration (composite of first/second-term key figures)
update public.cabinets set members = jsonb_build_object(
  'pm',      jsonb_build_object('name', 'Ronald Reagan',   'title', 'President',           'initials', 'RR'),
  'economy', jsonb_build_object('name', 'James Baker',     'title', 'Treasury Secretary',  'initials', 'JB'),
  'justice', jsonb_build_object('name', 'Edwin Meese',     'title', 'Attorney General',    'initials', 'EM'),
  'ecology', jsonb_build_object('name', 'Anne Gorsuch',    'title', 'EPA Administrator',   'initials', 'AG'),
  'tech',    jsonb_build_object('name', 'Raymond Donovan', 'title', 'Secretary of Labor',  'initials', 'RD')
) where slug = 'reagan';

-- Clinton administration
update public.cabinets set members = jsonb_build_object(
  'pm',      jsonb_build_object('name', 'Bill Clinton',  'title', 'President',           'initials', 'BC'),
  'economy', jsonb_build_object('name', 'Robert Rubin',  'title', 'Treasury Secretary',  'initials', 'RR'),
  'justice', jsonb_build_object('name', 'Janet Reno',    'title', 'Attorney General',    'initials', 'JR'),
  'ecology', jsonb_build_object('name', 'Carol Browner', 'title', 'EPA Administrator',   'initials', 'CB'),
  'tech',    jsonb_build_object('name', 'Robert Reich',  'title', 'Secretary of Labor',  'initials', 'BR')
) where slug = 'clinton';

-- Obama administration
update public.cabinets set members = jsonb_build_object(
  'pm',      jsonb_build_object('name', 'Barack Obama',     'title', 'President',           'initials', 'BO'),
  'economy', jsonb_build_object('name', 'Timothy Geithner', 'title', 'Treasury Secretary',  'initials', 'TG'),
  'justice', jsonb_build_object('name', 'Eric Holder',      'title', 'Attorney General',    'initials', 'EH'),
  'ecology', jsonb_build_object('name', 'Lisa Jackson',     'title', 'EPA Administrator',   'initials', 'LJ'),
  'tech',    jsonb_build_object('name', 'Hilda Solis',      'title', 'Secretary of Labor',  'initials', 'HS')
) where slug = 'obama';

-- Trump administration
update public.cabinets set members = jsonb_build_object(
  'pm',      jsonb_build_object('name', 'Donald Trump',    'title', 'President',           'initials', 'DT'),
  'economy', jsonb_build_object('name', 'Steven Mnuchin',  'title', 'Treasury Secretary',  'initials', 'SM'),
  'justice', jsonb_build_object('name', 'William Barr',    'title', 'Attorney General',    'initials', 'WB'),
  'ecology', jsonb_build_object('name', 'Andrew Wheeler',  'title', 'EPA Administrator',   'initials', 'AW'),
  'tech',    jsonb_build_object('name', 'Eugene Scalia',   'title', 'Secretary of Labor',  'initials', 'ES')
) where slug = 'trump';

-- Biden administration
update public.cabinets set members = jsonb_build_object(
  'pm',      jsonb_build_object('name', 'Joe Biden',       'title', 'President',           'initials', 'JB'),
  'economy', jsonb_build_object('name', 'Janet Yellen',    'title', 'Treasury Secretary',  'initials', 'JY'),
  'justice', jsonb_build_object('name', 'Merrick Garland', 'title', 'Attorney General',    'initials', 'MG'),
  'ecology', jsonb_build_object('name', 'Michael Regan',   'title', 'EPA Administrator',   'initials', 'MR'),
  'tech',    jsonb_build_object('name', 'Marty Walsh',     'title', 'Secretary of Labor',  'initials', 'MW')
) where slug = 'biden';
