# pull official base images
FROM python:3.12-slim

# set work directory
WORKDIR /usr/src/eraauto

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential default-libmysqlclient-dev pkg-config && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

# copy project
COPY . .