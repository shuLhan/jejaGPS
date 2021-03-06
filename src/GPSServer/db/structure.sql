drop table if exists trail;
drop table if exists client;

create table client (
	id		varchar(64)	primary key
,	description	varchar(512)
);

create table trail (
	id		serial		primary key
,	id_gps		varchar(64)
,	dt_gps		timestamp
,	dt_retrieved	timestamp	default now()
,	latitude	varchar(12)
,	longitude	varchar(12)
);
