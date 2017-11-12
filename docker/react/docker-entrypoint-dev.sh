#!/bin/sh
set -e

if [ -z "`find /code/node_modules/ -type f`" ]; then
    cp -R /node_modules.build/* /code/node_modules/
fi

if [ "x$REACT_NPM_INSTALL" = 'xon' ]; then
    cd /code && /usr/local/bin/npm install
fi

cd /code

exec "$@"