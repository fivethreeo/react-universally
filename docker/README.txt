Build base images:

docker-compose build


For development:

docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml up

Go to http://localhost:1337/


For production:

docker-compose -f docker-compose-prod.yml build
docker-compose -f docker-compose-prod.yml up

Go to http://localhost/
