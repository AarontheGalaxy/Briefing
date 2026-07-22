FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as non-root; /app/data must be writable for the SQLite volume
RUN useradd --create-home app && mkdir -p /app/data && chown -R app /app
USER app

EXPOSE 8000

# --proxy-headers: trust X-Forwarded-For from nginx so rate limiting sees real
# client IPs. Safe because the backend port is not published outside compose.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
