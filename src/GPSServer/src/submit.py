#!/usr/bin/python2

import sys
import cgi
import cgitb
import psycopg2

sys.stderr = sys.stdout
cgitb.enable()

try:
	form		= cgi.FieldStorage(keep_blank_values=1)
	id_gps		= form["id"].value
	dt_gps		= form["datetime"].value
	latitude	= form["latitude"].value
	longitude	= form["longitude"].value

	conn	= psycopg2.connect(host="127.0.0.1", database="gpsdb", user="gpsdb", password="gpsdb")
	cur	= conn.cursor()

	q	=" insert into trail ("		\
		+"   id_gps"			\
		+" , dt_gps"			\
		+" , latitude"			\
		+" , longitude"			\
		+" ) values (%s, %s, %s, %s);"

	data	=(id_gps, dt_gps, latitude, longitude)

	cur.execute(q, data)

	conn.commit()

	cur.close()
	conn.close()

	print "id_gps		: ", id_gps
	print "dt_gps		: ", dt_gps
	print "latitude 	: ", latitude
	print "longitude	: ", longitude

	print "{success:true,info:'Success'}"
except:
	print "{success:false,info:'Error submitting gpsclient data to database'}"
