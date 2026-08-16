FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Prisma (Node.js engine requires libatomic1 and openssl)
RUN apt-get update && apt-get install -y \
    libatomic1 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Generate Prisma Client
RUN prisma generate

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
