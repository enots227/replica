#!/bin/bash

rm -r -f            "/opt/venv"
python3 -m venv     "/opt/venv"
source              "/opt/venv/bin/activate"
pip3 install wheel
pip3 install -r     "/tmp/requirements.txt"
