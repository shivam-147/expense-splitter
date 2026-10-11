
.PHONY: up down restart build logs ps stop clean

# Start containers in the background
up:
	docker compose up -d

# Stop and remove containers
down:
	docker compose down

# Restart containers
restart:
	docker compose restart

# Build and start containers
build:
	docker compose up --build -d

# Show container logs
logs:
	docker compose logs -f

# Show running containers
ps:
	docker compose ps

# Stop containers without removing them
stop:
	docker compose stop

# Remove containers and volumes (WARNING: deletes database data in volumes)
clean:
	docker compose down -v
