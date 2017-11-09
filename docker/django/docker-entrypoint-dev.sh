set -e

# until psql $DATABASE_URL -c '\l'; do
#   >&2 echo "Postgres is unavailable - sleeping"
#   sleep 1
# done

# >&2 echo "Postgres is up - continuing"

if [ -z "`find /venv/ -type f`" ]; then
    cp -R /venv.tmp/* /venv/
fi

if [ "x$DJANGO_PIP_INSTALL" = 'xon' ]; then
    /venv/bin/pip install requirements.txt 
fi

if [ "x$DJANGO_MANAGEPY_MIGRATE" = 'xon' ]; then
    /venv/bin/python manage.py migrate --noinput
fi

if [ "x$DJANGO_MANAGEPY_COLLECTSTATIC" = 'xon' ]; then
    /venv/bin/python manage.py collectstatic --noinput
fi
