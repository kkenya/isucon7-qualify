#!/bin/bash
set -ex

if [ -f /var/lib/mysql/slow.log ]; then
    sudo mv /var/log/mysql/slow.log /var/log/mysql/slow.log.$(date +%Y%m%d-%H%M%S) && sudo mysqladmin flush-logs
fi
if [ -f /var/log/nginx/access.log ]; then
    sudo mv /var/log/nginx/access.log /var/log/nginx/access.log.$(date +%Y%m%d-%H%M%S)
fi
sudo systemctl restart mysql
sudo systemctl restart nginx
sudo systemctl restart isubata.nodejs
sudo journalctl -f
