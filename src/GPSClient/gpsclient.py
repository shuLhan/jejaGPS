#
# gpsclient.py
# Author:
#   - Mhd Sulhan (ms@kilabit.org)
#
# Part of script was taken from file gps.py using PySerial library,
# rewritten by ms@kilabit.org using USPP library.
#
# Copyright (c) IBM Corporation, 2006. All Rights Reserved.
# Author:
#   - Simon Johnston (skjohn@us.ibm.com)
#

import sys
import signal
import os
import time
import datetime
import httplib
import urllib
import ConfigParser

sys.path.append ("./lib/")
sys.path.append ("./lib/uspp")

from uspp import *

class GPSClient:
	_debug			= True
	_cfg_file		= "jejagps.conf"
	_id			= os.getenv("COMPUTERNAME")
	_running		= 1
	_date			= ""
	_time			= ""
	_lat			= 0.0
	_lng			= 0.0
	_tty			= None
	_gps_port		= "COM3"
	_gps_baud		= 4800
	_gps_header		= "GPRMC"
	_tracker_mode		= "http"
	_tracker_conn		= None
	_tracker_addr		= "127.0.0.1:8080"
	_tracker_url		= "/submit.py"
	_tracker_send_dly	= 60

	def __init__(self				\
			, gps_port="COM3"		\
			, gps_baud=4800			\
			, gps_header="GPRMC"		\
			, tracker_mode="http"		\
			, tracker_addr="127.0.0.1:8080"	\
			, tracker_url="/submit.py"	\
			, tracker_send_delay=60):
		# read user configuration
		cfg = ConfigParser.SafeConfigParser ({		\
			"port"		:gps_port		\
		,	"baud"		:gps_baud		\
		,	"header"	:gps_header		\
		,	"mode"		:tracker_mode		\
		,	"address"	:tracker_addr		\
		,	"url"		:tracker_url		\
		,	"send delay"	:tracker_send_delay	\
		})

		cfg.read(self._cfg_file)

		self._gps_port		= cfg.get("GPS", "port")
		self._gps_baud		= cfg.getint("GPS", "baud")
		self._gps_header	= cfg.get("GPS", "header")
		self._tracker_mode	= cfg.get("Tracker", "Mode")
		self._tracker_addr	= cfg.get("Tracker", "Address")
		self._tracker_url	= cfg.get("Tracker", "URL")
		self._tracker_send_dly	= cfg.getint("Tracker", "Send Delay")

		if (self._debug):
			print	("\n[GPS]"			\
				"\n Port	= %s"		\
				"\n Baud	= %d"		\
				"\n Header	= %s"		\
				"\n[Tracker]"			\
				"\n Mode	= %s"		\
				"\n Address	= %s"		\
				"\n URL		= %s"		\
				"\n Send Delay	= %d"		\
				% (self._gps_port		\
				, self._gps_baud		\
				, self._gps_header		\
				, self._tracker_mode		\
				, self._tracker_addr		\
				, self._tracker_url		\
				, self._tracker_send_dly)	\
			)

		print ("connecting to serial port ...")
		self._tty = SerialPort (self._gps_port, None, self._gps_baud)

		signal.signal (signal.SIGINT, self.sighandler)

	def __del__(self):
		if self._tty != None:
			del self._tty

	def sighandler (self, signum, frame):
		self._running = 0

	def get_date (self, data):
		""" @method : get_date
			@param	:
				> data	: string date in format DDMMYY
			@return : string date in format YYYY-MM-DD
		"""
		now = datetime.date.today()
		if data == None:
			return "%04d-%02d-%02d" % (now.year, now.month, now.day)

		d = data[:2]
		m = data[2:4]
		y = int(data[4:])

		if y + 2000 > now.year:
			y = y + 1900
		else:
			y = y + 2000

		return "%d-%0s-%0s" % (y,m,d);

	def get_time (self, data):
		""" @method : get_time(data)
			@param	:
				> data	: GPS string time in 'HHMMSS' format.
			@return : string time in UTC format.
			@desc	: Convert GPS HHMMSS into HH:MM:SS UTC
		"""
		utc_str = ' +00:00'
		t = datetime.time(int(data[:2]), int(data[2:4]), int(data[4:6]))
		return t.strftime('%H:%M:%S') + utc_str

	def get_latitude (self, data, direction):
		dot = data.find('.')

		d = data[0:dot-2]
		if d[0] == '0':
			d = d[1:]
		if direction in ['S','W']:
			d = '-' + d

		n = ((float(data[dot-2:]) / 60.0) * 100.0) * 10000.0
		return "%s.%06d" % (d, n)

	def get_longitude (self, data, direction):
		dot = data.find('.')

		d = data[0:dot-2]
		if d[0] == '0':
			d = d[1:]
		if direction in ['S','W']:
			d = '-' + d

		n = ((float(data[dot-2:]) / 60.0) * 100.0) * 10000.0
		return '%s.%06d' % (d, n)

	def checksum(self, line):
		""" @method	 : checksum
			@param		:
				> line	: one line read from GPS device
			@return	 : string
			@desc		: Internal method which calculates the XOR checksum
			over the sentence (as a string, not including the leading '$' or
			the final 3 characters, the ',' and checksum itself).
		"""
		cs = 0
		for c in line:
			cs = cs ^ ord(c)
		hexcs = "%02x" % cs
		return hexcs.upper()

	def validate (self, line):
		line.strip()
		if line.endswith("\r\n"):
			line = line[:len(line)-2]
		#
		# Note that sentences that start with '$P' are proprietary
		# formats and are described as $P<MID><SID> where MID is the
		# manufacturer identified (Magellan is MGN etc.) and then the
		# SID is the manufacturers sentence identifier.
		#
		if not line.startswith("$GP"):
			return None
		# get checksum value
		star = line.rfind('*')
		if star < 0:
			return None
		# check checksum value with our computed checksum
		cs		= line[star+1:]
		line	= line[1:star]
		line_cs = self.checksum(line)
		if cs != line_cs:
			return None
		return line.split(',')

	def decode_gpgga (self, r):
		self._date	= self.get_date (None)
		self._time	= self.get_time (r[1])
		self._lat	= self.get_latitude (r[2], r[3])
		self._lng	= self.get_longitude (r[4], r[5])

	def decode_gprmc (self, r):
		self._date	= self.get_date (r[9])
		self._time	= self.get_time (r[1])
		self._lat	= self.get_latitude (r[3],r[4])
		self._lng	= self.get_longitude (r[5],r[6])

	def run (self):
		resp = None
		while self._running:
			self._tty.flush ()
			print ("waiting for data ...")
			while self._running:
				line = self._tty.readline ()

				if (self._debug):
					print ("line : ", line);

				r = self.validate (line)
				if r == None:
					continue
				if r[0] != self._gps_header:
					continue
				if r[0].upper() == "GPGGA":
					self.decode_gpgga (r)
				elif r[0].upper() == "GPRMC":
					self.decode_gprmc (r)
				break

			print ("id		: "+ self._id)
			print ("date		: "+ self._date)
			print ("time		: "+ self._time)
			print ("latitude	: "+ self._lat)
			print ("longitude	: "+ self._lng)

			params = urllib.urlencode({
				"id"		: self._id
			,	"datetime"	: self._date +' '+ self._time
			,	"latitude"	: self._lat
			,	"longitude"	: self._lng
			})
			headers = {
				"Content-type"	: "application/x-www-form-urlencoded"
			,	"Accept"	: "text/plain"
			}

			if (self._tracker_mode == "http"):
				self._tracker_conn = httplib.HTTPConnection(self._tracker_addr)
				self._tracker_conn.request("POST", self._tracker_url, params, headers)
				resp = self._tracker_conn.getresponse()
				data = resp.read()
				print resp.status, resp.reason
				print data
				self._tracker_conn.close()

			self._tty.flush ()
			time.sleep(self._tracker_send_dly)
			self._tty.flush ()

if __name__ == "__main__":
	gpsc = GPSClient ()
	gpsc.run ()
	del gpsc
