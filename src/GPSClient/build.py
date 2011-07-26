import sys

sys.path.append ("./lib/")
sys.path.append ("./lib/uspp")

from distutils.core import setup
import py2exe

class Target:
	def __init__(self, **kw):
		self.__dict__.update(kw)
		# for the versioninfo resources
		self.version		= "1.0.0.0"
		self.company_name	= "kilabit.org"
		self.copyright		= "kilabit.org"
		self.name		= "JejaGPS"
		self.description	= 'JejaGPS - GPS Tracker for thoughbook'

myservice = Target (
	modules		= ['gpsclient'],
	cmdline_style	= 'pywin32'
)

setup (
	service = [myservice],
	zipfile = None,
	options = {
		"py2exe":{
			"includes":"win32com,win32service,win32serviceutil,win32event",
			"optimize": '2'
		},
	}
)
