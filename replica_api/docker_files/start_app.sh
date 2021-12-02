#!/bin/bash
source "/opt/venv/bin/activate"
python3 /opt/app/replica_api/manage.py runserver "0.0.0.0:8000"
