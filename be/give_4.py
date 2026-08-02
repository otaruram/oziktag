import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    try:
        updated = await db.user.update_many(
            where={"isAdmin": False},
            data={
                "sisaKredit": 4,
                "apiKredit": 4
            }
        )
        print(f"Gave 4 credits to {updated} users")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
