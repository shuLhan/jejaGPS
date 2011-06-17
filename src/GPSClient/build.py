import sys

sys.path.append ("./lib/")
sys.path.append ("./lib/uspp")

from distutils.core import setup
import py2exe

setup(console=['gpsclient.py'])