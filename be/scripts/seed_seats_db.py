"""
Seed initial seats for Summarecon Mall Bandung (Rows A-J, 10 cols = 100 seats)
"""
import os
import psycopg2
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from dotenv import load_dotenv

load_dotenv("be/.env")
db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")

parsed = urlparse(db_url)
qs = parse_qs(parsed.query)
allowed_params = {"sslmode", "connect_timeout", "application_name"}
filtered_qs = {k: v for k, v in qs.items() if k in allowed_params}
clean_query = urlencode(filtered_qs, doseq=True)
clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, clean_query, parsed.fragment))

conn = psycopg2.connect(clean_url)
cur = conn.cursor()

def get_category_and_price(row: str, col: int):
    if row in ("A", "B"):
        return "VIP", 350000.00
    if col in (1, 2, 9, 10):
        return "WING", 85000.00
    return "REGULAR", 150000.00

rows = "ABCDEFGHIJ"
seats_to_insert = []
for row in rows:
    for col in range(1, 11):
        code = f"{row}-{col:02d}"
        category, price = get_category_and_price(row, col)
        seat_id = f"seat_{code}"
        seats_to_insert.append((seat_id, code, row, col, category, price, "AVAILABLE"))

print(f"Seeding {len(seats_to_insert)} seats...")
cur.executemany("""
    INSERT INTO event_seats (id, seat_code, row_label, col_number, category, price, status, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    ON CONFLICT (seat_code) DO NOTHING;
""", seats_to_insert)

conn.commit()

cur.execute("SELECT count(*), count(*) FILTER (WHERE status = 'AVAILABLE') FROM event_seats;")
total, available = cur.fetchone()
print(f"Total seats in database: {total}, Available: {available}")

cur.close()
conn.close()

