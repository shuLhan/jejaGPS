#!/usr/bin/python2

import cgi
import cgitb
import psycopg2

cgitb.enable()

try:
	print "Content-Type: text/plain"
	print

	conn	= psycopg2.connect(host="127.0.0.1", database="gpsdb", user="gpsdb", password="gpsdb")
	cur	= conn.cursor()

	o	="{data:["
	q	=" select distinct id_gps from trail;"

	cur.execute(q)

	i = 0
	for r in cur:
		if i > 0:
			o += ","
		else:
			i = 1
		o += "{ name:'"+ r[0] +"'}"

	o += "]}";

	print o
except:
	print "{success:false,info:'Error retrieving data gps!'}"
