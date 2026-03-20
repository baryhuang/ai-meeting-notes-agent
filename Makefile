.PHONY: install dev build dmg clean

install:
	cd web && bun install
	cd desktop && npm install

dev:
	@echo "Starting Vite dev server and Electron..."
	cd web && bun run dev &
	@sleep 3
	cd desktop && npm run dev

build:
	cd web && bun run build

dmg: build
	cd desktop && npm run dist:mac

clean:
	rm -rf web/dist desktop/dist
