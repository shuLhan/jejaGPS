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

	form	= cgi.FieldStorage()
	id_gps	=form["id_gps"].value
	o	="{data:["

	conn	= psycopg2.connect(host="127.0.0.1", database="gpsdb", user="gpsdb", password="gpsdb")
	cur	= conn.cursor()

	q	=" select	dt_retrieved"		\
		+" ,		dt_gps"			\
		+" ,		latitude"		\
		+" ,		longitude"		\
		+" from		trail"			\
		+" where	id_gps = %s"		\
		+" order by	dt_gps desc";

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
	print sys.exc_info()
	print "{success:false,info:'Error retrieving data trail!'}"
