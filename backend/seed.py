"""Seed admin + default products. Run: python backend/seed.py"""
import asyncio, os, uuid, bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

async def seed():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    pwd = bcrypt.hashpw(b"Hakki@Admin2026", bcrypt.gensalt()).decode()
    await db.users.update_one(
        {"email": "hakkiveda@gmail.com"},
        {"$set": {"name": "HAKKIVEDA Admin", "email": "hakkiveda@gmail.com",
                  "password": pwd, "is_admin": True, "must_change_password": True},
         "$setOnInsert": {"id": str(uuid.uuid4()), "addresses": [], "wishlist": [],
                          "cart": [], "reward_points": 0,
                          "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    print("✓ Admin seeded: hakkiveda@gmail.com / Hakki@Admin2026")
    print("✓ Products auto-seed on first backend startup if collection is empty")

if __name__ == "__main__":
    asyncio.run(seed())
