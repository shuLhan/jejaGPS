#!/usr/bin/python2

import sys
import cgi
import cgitb
import psycopg2

sys.stderr = sys.stdout
cgitb.enable()

try:
	print "Content-Type: text/plain"
	print

	form		= cgi.FieldStorage(keep_blank_values=1)
	id_gps		= form["id_gps"].value
	date_after	= form["date_after"].value
	time_after	= form["time_after"].value
	date_before	= form["date_before"].value
	time_before	= form["time_before"].value
	o		="{data:["

	conn	= psycopg2.connect(host="127.0.0.1", database="gpsdb", user="gpsdb", password="gpsdb")
	cur	= conn.cursor()

	q	=" select	dt_retrieved"		\
		+" ,		dt_gps"			\
		+" ,		latitude"		\
		+" ,		longitude"		\
		+" from		trail"			\
		+" where	id_gps = %s"		\
		+" and		(latitude != '0'"	\
		+" and		longitude != '0')"

	if (date_after != ""):
		q += " and dt_gps >= '"+ date_after
		if (time_after != ""):
			q += " "+ time_after
		q += "'"

	if (date_before != ""):
		q += " and dt_gps <= '"+ date_before
		if (time_before != ""):
			q += " "+ time_before
		q += "'"
	elif (time_before != ""):
		q += " and dt_gps <= '"+ date_after +" "+ time_before +"'"

	q	+= " order by dt_gps desc"

	data	=(id_gps,)

	cur.execute(q, data)

	i = 0
	for r in cur:
		if i > 0:
			o += ","
		else:
			i = 1
		o	+="{ dt_retrieved:'%s', dt_gps:'%s', latitude:'%s', longitude:'%s'}" % (r[0].isoformat(' '), r[1].isoformat(' '), r[2], r[3]);

	o += "]}";

	print o
except:
	print '{"success":false,"info":"Error retrieving data trail!"}'
