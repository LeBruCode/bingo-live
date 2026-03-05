
create table events (
id serial primary key,
name text not null,
created_at timestamp default now()
);

create table contributors (
email text primary key,
name text,
created_at timestamp default now()
);

create table participations (
id serial primary key,
token text,
name text,
email text,
stage text,
created_at timestamp default now()
);
