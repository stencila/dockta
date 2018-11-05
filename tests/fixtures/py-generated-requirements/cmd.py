"""A fake Python file with lots of different imports to test requirements generation."""


from __future__ import print_function
from django.conf import settings
import requests
import othersubmodule
from submodule import dockerother
import filemoduleone
from filemoduletwo import function_two
import StringIO
from datetime import datetime
import time


def main():
    othersubmodule.docktertest.test_method()
    dockerother.my_function()
    filemoduleone.function_one()
    function_two()

    print(requests)
    print(settings)
    print(StringIO)
    print(datetime.now())
    print(time.perf_counter())
