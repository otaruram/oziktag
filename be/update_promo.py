import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    try:
        updated = await db.user.update_many(
            where={},
            data={"receivesPromoEmails": False}
        )
        print(f"Updated {updated} users to have receivesPromoEmails = False")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
