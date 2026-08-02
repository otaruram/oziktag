import asyncio
import os
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    try:
        # Get all users who are not admins
        users = await db.user.find_many(where={"isAdmin": False})
        user_ids = [u.id for u in users]

        print(f"Found {len(user_ids)} non-admin users. Wiping their data...")

        if not user_ids:
            print("No non-admin users found.")
            return

        # Delete data in related tables for these users
        await db.kyc.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted KYC records")
        
        await db.qcproduct.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted QC Products")
        
        await db.trackingproduct.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted Tracking Products")
        
        await db.topuptransaction.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted TopUp Transactions")
        
        await db.creditlog.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted Credit Logs")
        
        await db.productscan.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted Product Scans")
        
        await db.apikey.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted API Keys")
        
        await db.apiaccessrequest.delete_many(where={"userId": {"in": user_ids}})
        print("Deleted API Access Requests")
        
        # Reset their user profiles to "like new"
        await db.user.update_many(
            where={"id": {"in": user_ids}},
            data={
                "sisaKredit": 0,
                "apiKredit": 0,
                "hasApiAccess": False,
                "isBanned": False,
                "isElite": False,
                "eliteExpiresAt": None,
                "creditScoreRequested": False,
            }
        )
        print("Reset user balances and flags")

        print("Wipe complete!")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
