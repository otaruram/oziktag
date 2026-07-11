from app.database import db

async def deduct_qr_credit(user_id: str, is_admin: bool, credits: int, description: str):
    """Deduct 1 QR credit if not admin."""
    async with db.tx() as tx:
        if not is_admin:
            await tx.user.update(
                where={"id": user_id},
                data={"sisaKredit": credits - 1}
            )
        await tx.creditlog.create(
            data={
                "userId": user_id,
                "tipeKredit": "QR",
                "action": "USAGE",
                "amount": 0 if is_admin else -1,
                "description": description
            }
        )

async def refund_qr_credit(user_id: str, is_admin: bool, credits: int, description: str):
    """Refund 1 QR credit if not admin."""
    if not is_admin:
        async with db.tx() as tx:
            await tx.user.update(
                where={"id": user_id},
                data={"sisaKredit": credits}
            )
            await tx.creditlog.create(
                data={
                    "userId": user_id,
                    "tipeKredit": "QR",
                    "action": "REFUND",
                    "amount": 1,
                    "description": description
                }
            )

async def add_credits(user_id: str, amount: int, tipe_kredit: str, description: str, tx_client=None):
    """
    Add credits to user. Can run inside an existing transaction if tx_client is provided,
    otherwise creates its own transaction.
    """
    db_client = tx_client if tx_client else db
    
    if not tx_client:
        async with db.tx() as tx:
            await _add_credits_logic(tx, user_id, amount, tipe_kredit, description)
    else:
        await _add_credits_logic(tx_client, user_id, amount, tipe_kredit, description)

async def _add_credits_logic(tx, user_id: str, amount: int, tipe_kredit: str, description: str):
    user = await tx.user.find_unique(where={"id": user_id})
    if not user:
        return
        
    if tipe_kredit == "API":
        await tx.user.update(
            where={"id": user_id},
            data={"apiKredit": user.apiKredit + amount}
        )
    else:
        await tx.user.update(
            where={"id": user_id},
            data={"sisaKredit": user.sisaKredit + amount}
        )
        
    await tx.creditlog.create(
        data={
            "userId": user_id,
            "tipeKredit": tipe_kredit,
            "action": "TOPUP",
            "amount": amount,
            "description": description
        }
    )
