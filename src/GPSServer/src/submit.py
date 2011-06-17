#!/usr/bin/python2

import cgi
import cgitb
import psycopg2

cgitb.enable()

try:
	form		= cgi.FieldStorage()
	id_gps		= form["id"].value
	dt_retrieved	= form["datetime"].value
	latitude	= form["latitude"].value
	longitude	= form["longitude"].value

	conn	= psycopg2.connect(host="127.0.0.1", database="gpsdb", user="gpsdb", password="gpsdb")
	cur	= conn.cursor()

	q	=" insert into trail (id_gps, dt_retrieved, latitude, longitude) values (%s, %s, %s, %s);"

	data	=(id_gps, dt_retrieved, latitude, longitude)

	cur.execute(q, data)

	conn.commit()

	cur.close()
	conn.close()

	print "id_gps		: ", id_gps
	print "dt_retrieved	: ", dt_retrieved
	print "latitude 	: ", latitude
	print "longitude	: ", longitude
except:
	print "{success:false,info:'Error submiting gpsclient to database'}"
