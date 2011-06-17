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

sys.path.append ("./lib/")
sys.path.append ("./lib/uspp")

from uspp import *

class GPSClient:
    id      = os.getenv("COMPUTERNAME")
    running = 1
    date    = ""
    time    = ""
    lat     = 0.0
    lng     = 0.0
    tty     = None
    port    = "COM3"
    baud    = 4800
    delay   = 10
    header  = "GPRMC"

    def __init__(self, port="COM3", delay=10, baud=4800, header="GPGGA"):
        self.port   = port
        self.delay  = delay
        self.baud   = baud
        self.header = header

        print ("connecting to serial port ...")
        self.tty = SerialPort (self.port, None, self.baud)

        signal.signal (signal.SIGINT, self.sighandler)

    def __del__(self):
        if self.tty != None:
            del self.tty

    def sighandler (self, signum, frame):
        self.running = 0

    def get_date (self, data):
        """ @method : get_date
            @param  :
                > data  : string date in format DDMMYY
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
            @param  :
                > data  : GPS string time in 'HHMMSS' format.
            @return : string time in UTC format.
            @desc   : Convert GPS HHMMSS into HH:MM:SS UTC
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
        """ @method     : checksum
            @param      :
                > line  : one line read from GPS device
            @return     : string
            @desc       : Internal method which calculates the XOR checksum
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
        cs      = line[star+1:]
        line    = line[1:star]
        line_cs = self.checksum(line)
        if cs != line_cs:
             return None
        return line.split(',')

    def decode_gpgga (self, r):
        self.date = self.get_date (None)
        self.time = self.get_time (r[1])
        self.lat  = self.get_latitude (r[2], r[3])
        self.lng  = self.get_longitude (r[4], r[5])

    def decode_gprmc (self, r):
        self.date = self.get_date (r[9])
        self.time = self.get_time (r[1])
        self.lat  = self.get_latitude (r[3],r[4])
        self.lng  = self.get_longitude (r[5],r[6])

    def run (self):
        while self.running:
            self.tty.flush ()
            print ("waiting for data ...")
            while self.running:
                line = self.tty.readline ()
#                print ("line : ", line);
                r    = self.validate (line)
                if r == None:
                    continue
                if r[0] != self.header:
                    continue
                if r[0].upper() == "GPGGA":
                    self.decode_gpgga (r)
                elif r[0].upper() == "GPRMC":
                    self.decode_gprmc (r)
                break
            print ("id        : "+ self.id)
            print ("date      : "+ self.date)
            print ("time      : "+ self.time)
            print ("latitude  : "+ self.lat)
            print ("longitude : "+ self.lng)
            self.tty.flush ()
            time.sleep(self.delay)
            self.tty.flush ()

if __name__ == "__main__":
    gpsc = GPSClient ()
    gpsc.run ()
    del gpsc
