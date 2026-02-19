FROM python:3.13-slim

WORKDIR /app

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for caching
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --no-dev --no-install-project

# Copy application code
COPY . .

# Run the telegram bot
CMD ["uv", "run", "telegram_bot.py"]
