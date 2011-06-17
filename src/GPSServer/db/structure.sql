drop table trail if exists;
drop table client if exists;

create table client (
	id		varchar(64)	primary key
,	description	varchar(512)
);

create table trail (
	id		serial		primary key
,	id_gps		varchar(64)
,	dt_retrieved	timestamp
,	latitude	varchar(12)
,	longitude	varchar(12)
);
