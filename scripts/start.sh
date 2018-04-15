#!/usr/bin/env bash
# @author: Walley Yang

# Start MongoDB
echo "Starting MongoDB..."
sudo service mongod start

# Start NodeJS
echo "Starting NodeJS..."
node /var/www/app.js
