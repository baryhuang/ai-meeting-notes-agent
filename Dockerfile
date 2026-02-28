# Stage 1: Build frontend
FROM node:22-slim AS frontend
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY web/ .
RUN npm run build

# Stage 2: Python app + built frontend
FROM python:3.13-slim
WORKDIR /app

# Install curl for ECS health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for caching
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --no-dev --no-install-project

# Copy application code
COPY . .

# Copy built frontend from stage 1
COPY --from=frontend /web/dist ./web/dist

# Run the telegram bot + web dashboard
CMD ["uv", "run", "server/telegram_bot.py"]
