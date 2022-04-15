# syntax=docker/dockerfile:1
FROM python:3 AS base

# Install Linux Packages
RUN apt update
RUN apt install dos2unix

# Install Kafka Dependencies
ENV LIBRDKAFKA_VERSION v1.6.2
RUN git clone https://github.com/edenhill/librdkafka.git /tmp/.librdkafka && \
    cd /tmp/.librdkafka && \
    git checkout $LIBRDKAFKA_VERSION && \
    ./configure --install-deps && \
    make && \
    make install && \
    ldconfig

# Build Only Environment Variables
ARG PYPI_PROTOCOL=http
ARG PYPI_PORT=7001

# Copy Build Script
COPY ./scripts/build.sh /usr/src/bin/build.sh
RUN  dos2unix           /usr/src/bin/build.sh

# Package Install List
COPY ./requirements.txt /tmp/app/requirements.txt
RUN  dos2unix           /tmp/app/requirements.txt

# Build Python Environment
RUN bash /usr/src/bin/build.sh

# Entrypoint
WORKDIR /usr/src/app

ENTRYPOINT /usr/src/bin/start.sh

# Production ###############################
FROM base AS production

# Copy Production Start Script
COPY ./scripts/start.sh /usr/src/bin/start.sh
RUN  dos2unix           /usr/src/bin/start.sh

# Cleanup
RUN rm /usr/src/bin/build.sh

# Development ##############################
FROM base AS development

# Copy Development Scripts
COPY ./scripts/development/build.sh    /usr/src/bin/development/build.sh
RUN  dos2unix                          /usr/src/bin/development/build.sh

COPY ./scripts/development/start.sh    /usr/src/bin/start.sh
RUN  dos2unix                          /usr/src/bin/start.sh

COPY ./scripts/development/coverage.sh /usr/src/bin/development/coverage.sh
RUN  dos2unix                          /usr/src/bin/development/coverage.sh

# Install Development Python Packages
RUN bash /usr/src/bin/development/build.sh
