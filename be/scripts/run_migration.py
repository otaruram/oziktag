"""
Execute event_ticketing.sql against the live database using DIRECT_URL or DATABASE_URL from .env
"""
import os
import psycopg2
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from dotenv import load_dotenv

load_dotenv("be/.env")

# Prefer DIRECT_URL (direct port 5432) for DDL / migrations
db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in be/.env")
    exit(1)

# Clean query params not supported by psycopg2 (e.g. pgbouncer=true, connection_limit=1)
parsed = urlparse(db_url)
qs = parse_qs(parsed.query)
allowed_params = {"sslmode", "connect_timeout", "application_name"}
filtered_qs = {k: v for k, v in qs.items() if k in allowed_params}
clean_query = urlencode(filtered_qs, doseq=True)
clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, clean_query, parsed.fragment))

print("Connecting to PostgreSQL...")
try:
    conn = psycopg2.connect(clean_url)
    cur = conn.cursor()
    
    with open("be/sql/event_ticketing.sql", "r", encoding="utf-8") as f:
        sql = f.read()
        
    print("Executing event_ticketing.sql migration...")
    cur.execute(sql)
    conn.commit()
    print("Migration executed successfully!")
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('event_seats', 'ticket_transactions')
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    print("Verified tables in database:", tables)

    # Let's check how many seats exist
    cur.execute("SELECT count(*) FROM event_seats;")
    seat_count = cur.fetchone()[0]
    print(f"Current seat count in event_seats: {seat_count}")
    
    cur.close()
    conn.close()
except Exception as e:
    print("Database connection / execution error:", e)
    exit(1)
