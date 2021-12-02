FROM python_st1

# COPY SCRIPTS
COPY ./replica_s4/replica_broadcast/docker_files/build_env.sh   /opt/bin/build_env.sh
COPY ./replica_s4/replica_broadcast/docker_files/start_app.sh   /opt/bin/start_app.sh

# Packages
COPY ./django_s4                                                /tmp/django_s4

# Package Install List
COPY ./replica_s4/replica_broadcast/requirements.txt            /tmp/requirements.txt
COPY ./replica_s4/replica_broadcast/requirements_custom.txt     /tmp/requirements_custom.txt

# FIX: CONVERT SCRIPTS FROM DOS TO UNIX
RUN apt-get update
RUN apt-get install dos2unix
RUN dos2unix /opt/bin/build_env.sh
RUN dos2unix /opt/bin/start_app.sh

# Setup Python Environment
RUN /opt/bin/build_env.sh

ENTRYPOINT /opt/bin/start_app.sh