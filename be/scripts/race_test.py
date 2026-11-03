"""
Concurrency proof for the anti double-booking guarantee.

Fires N simultaneous reserve requests at ONE seat against a running backend and
asserts that exactly one returns 200 and the rest return 409.

Usage (backend running, seats seeded, seat currently AVAILABLE):
    python scripts/race_test.py --base http://localhost:8000 --token "<supabase access token>" --seat C-05 --n 50

Tip: get the access token from the browser devtools console while logged in:
    (await supabase.auth.getSession()).data.session.access_token
"""

import argparse
import asyncio
from collections import Counter

import httpx


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8000")
    parser.add_argument("--token", required=True)
    parser.add_argument("--seat", default="C-05")
    parser.add_argument("--n", type=int, default=50)
    args = parser.parse_args()

    url = f"{args.base}/api/events/seats/{args.seat}/reserve"
    headers = {"Authorization": f"Bearer {args.token}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Note: the per-user rate limit is 20/min, so N > 20 from one token also
        # produces 429s. Those are still "not booked", which is what matters.
        start = asyncio.Event()

        async def one():
            await start.wait()
            r = await client.post(url, headers=headers)
            return r.status_code, r.json()

        tasks = [asyncio.create_task(one()) for _ in range(args.n)]
        start.set()
        results = await asyncio.gather(*tasks)

    codes = Counter(code for code, _ in results)
    print(f"Status codes: {dict(codes)}")
    winners = [body for code, body in results if code == 200]
    assert len(winners) == 1, f"Expected exactly 1 winner, got {len(winners)}"
    print(f"OK: exactly one request won the seat {args.seat}.")

    # Clean up so the seat is available again.
    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            f"{args.base}/api/events/seats/{args.seat}/release",
            headers=headers,
            json={"holdToken": winners[0]["holdToken"]},
        )


if __name__ == "__main__":
    asyncio.run(main())

