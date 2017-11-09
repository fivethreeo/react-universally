#!/bin/sh
set -e

if [ "x$REACT_COPY_STATIC" = 'xon' ]; then
    cp -R /code/build/client/* /static/
fi

cd /code

exec "$@"
