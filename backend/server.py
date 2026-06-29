from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
from google import genai
from google.genai import types as genai_types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 168))

# ── Google Gen AI client ──────────────────────────────────────────────────────
# Reads GOOGLE_API_KEY from the environment automatically.
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GEMINI_TEXT_MODEL = "gemini-2.5-flash"
genai_client = genai.Client(api_key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None

app = FastAPI(title="HAKKIVEDA API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ============ MODELS ============
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class AddressModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    country: str = "India"
    is_default: bool = False


class CartItem(BaseModel):
    product_id: str
    qty: int = 1


class CartUpdateRequest(BaseModel):
    product_id: str
    qty: int


class WishlistUpdateRequest(BaseModel):
    product_id: str


class CheckoutRequest(BaseModel):
    address: AddressModel
    payment_method: str  # "cod" or "mock_online"
    coupon_code: Optional[str] = None


class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    title: str
    comment: str


class QuizSubmission(BaseModel):
    quiz_type: str  # "hair" or "skin"
    answers: Dict[str, Any]


class ChatMessage(BaseModel):
    session_id: str
    message: str


class NewsletterSignup(BaseModel):
    email: EmailStr


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    subject: str
    message: str


# ============ AUTH HELPERS ============
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()


def verify_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode(), hashed.encode())


def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user=Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "addresses": [],
        "wishlist": [],
        "cart": [],
        "reward_points": 100,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, req.email.lower())
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email.lower(), "reward_points": 100}}


@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "reward_points": user.get("reward_points", 0),
            "is_admin": user.get("is_admin", False),
            "must_change_password": user.get("must_change_password", False),
        },
    }


@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"password": hash_password(req.new_password)}}
    )
    return {"ok": True, "message": "Password reset successfully"}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ============ PRODUCTS ============
@api_router.get("/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None):
    q: Dict[str, Any] = {}
    if category and category != "all":
        q["category"] = category
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    items = await db.products.find(q, {"_id": 0}).to_list(200)
    return items


@api_router.get("/products/featured")
async def featured():
    items = await db.products.find({"featured": True}, {"_id": 0}).to_list(20)
    return items


@api_router.get("/products/best-sellers")
async def best_sellers():
    items = await db.products.find({"best_seller": True}, {"_id": 0}).to_list(20)
    return items


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    item = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    # related products from same category
    related = await db.products.find(
        {"category": item["category"], "slug": {"$ne": slug}}, {"_id": 0}
    ).to_list(4)
    item["related"] = related
    # reviews
    reviews = await db.reviews.find({"product_id": item["id"]}, {"_id": 0}).to_list(50)
    item["reviews"] = reviews
    return item


# ============ REVIEWS ============
@api_router.post("/reviews")
async def add_review(req: ReviewCreate, user=Depends(get_current_user)):
    review = {
        "id": str(uuid.uuid4()),
        "product_id": req.product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": req.rating,
        "title": req.title,
        "comment": req.comment,
        "verified": True,
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return review


# ============ CART ============
@api_router.get("/cart")
async def get_cart(user=Depends(get_current_user)):
    cart = user.get("cart", [])
    product_ids = [c["product_id"] for c in cart]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    pmap = {p["id"]: p for p in products}
    enriched = []
    for c in cart:
        p = pmap.get(c["product_id"])
        if p:
            enriched.append({**p, "qty": c["qty"]})
    return enriched


@api_router.post("/cart")
async def add_to_cart(req: CartUpdateRequest, user=Depends(get_current_user)):
    cart = user.get("cart", [])
    found = False
    for c in cart:
        if c["product_id"] == req.product_id:
            c["qty"] = req.qty
            found = True
            break
    if not found and req.qty > 0:
        cart.append({"product_id": req.product_id, "qty": req.qty})
    cart = [c for c in cart if c["qty"] > 0]
    await db.users.update_one({"id": user["id"]}, {"$set": {"cart": cart}})
    return {"ok": True, "cart": cart}


@api_router.delete("/cart/{product_id}")
async def remove_cart(product_id: str, user=Depends(get_current_user)):
    cart = [c for c in user.get("cart", []) if c["product_id"] != product_id]
    await db.users.update_one({"id": user["id"]}, {"$set": {"cart": cart}})
    return {"ok": True}


# ============ WISHLIST ============
@api_router.get("/wishlist")
async def get_wishlist(user=Depends(get_current_user)):
    ids = user.get("wishlist", [])
    items = await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(50)
    return items


@api_router.post("/wishlist")
async def toggle_wishlist(req: WishlistUpdateRequest, user=Depends(get_current_user)):
    wishlist = user.get("wishlist", [])
    if req.product_id in wishlist:
        wishlist.remove(req.product_id)
    else:
        wishlist.append(req.product_id)
    await db.users.update_one({"id": user["id"]}, {"$set": {"wishlist": wishlist}})
    return {"ok": True, "wishlist": wishlist}


# ============ ADDRESSES ============
@api_router.post("/addresses")
async def add_address(addr: AddressModel, user=Depends(get_current_user)):
    addresses = user.get("addresses", [])
    if addr.is_default:
        for a in addresses:
            a["is_default"] = False
    addresses.append(addr.model_dump())
    await db.users.update_one({"id": user["id"]}, {"$set": {"addresses": addresses}})
    return {"ok": True, "addresses": addresses}


@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user=Depends(get_current_user)):
    addresses = [a for a in user.get("addresses", []) if a["id"] != address_id]
    await db.users.update_one({"id": user["id"]}, {"$set": {"addresses": addresses}})
    return {"ok": True}


# ============ ORDERS ============
COUPONS = {
    "TRIBAL10": {"discount_pct": 10, "min_order": 0},
    "AYUR20": {"discount_pct": 20, "min_order": 1500},
    "HAKKI500": {"discount_flat": 500, "min_order": 2500},
}


@api_router.post("/checkout")
async def checkout(req: CheckoutRequest, user=Depends(get_current_user)):
    cart = user.get("cart", [])
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    product_ids = [c["product_id"] for c in cart]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    pmap = {p["id"]: p for p in products}
    subtotal = 0
    items = []
    for c in cart:
        p = pmap.get(c["product_id"])
        if not p:
            continue
        line = p["price"] * c["qty"]
        subtotal += line
        items.append({"product_id": p["id"], "name": p["name"], "price": p["price"], "qty": c["qty"], "image": p["images"][0] if p.get("images") else ""})
    discount = 0
    coupon_applied = None
    if req.coupon_code:
        code = req.coupon_code.upper()
        coupon = COUPONS.get(code)
        if coupon and subtotal >= coupon.get("min_order", 0):
            if "discount_pct" in coupon:
                discount = subtotal * coupon["discount_pct"] / 100
            else:
                discount = coupon.get("discount_flat", 0)
            coupon_applied = code
    shipping = 0 if subtotal >= 999 else 79
    total = subtotal - discount + shipping
    order_id = "HKV" + datetime.now().strftime("%Y%m%d") + str(uuid.uuid4())[:6].upper()
    order = {
        "id": order_id,
        "user_id": user["id"],
        "items": items,
        "address": req.address.model_dump(),
        "payment_method": req.payment_method,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "shipping": round(shipping, 2),
        "total": round(total, 2),
        "coupon": coupon_applied,
        "status": "confirmed",
        "tracking_stages": [
            {"stage": "Order Placed", "completed": True, "at": now_iso()},
            {"stage": "Processing", "completed": False, "at": None},
            {"stage": "Shipped", "completed": False, "at": None},
            {"stage": "Out for Delivery", "completed": False, "at": None},
            {"stage": "Delivered", "completed": False, "at": None},
        ],
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)
    # clear cart
    await db.users.update_one({"id": user["id"]}, {"$set": {"cart": []}})
    # Send order confirmation email (skipped if not configured)
    try:
        items_html = "".join([f"<li>{it['name']} × {it['qty']} — ₹{it['price']*it['qty']}</li>" for it in items])
        html = f"<h2>Dhanyavaad 🙏</h2><p>Your HAKKIVEDA order {order_id} is confirmed.</p><ul>{items_html}</ul><p><b>Total: ₹{total:.0f}</b></p><p>Tagline: Hakki Pikki Tribal Wisdom, Ayurvedic Healing.</p>"
        await send_email(user["email"], f"Order Confirmed · {order_id}", html)
    except Exception:
        pass
    order.pop("_id", None)
    return order


@api_router.get("/orders")
async def list_orders(user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return orders


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api_router.post("/validate-coupon")
async def validate_coupon(payload: Dict[str, Any]):
    code = (payload.get("code") or "").upper()
    subtotal = float(payload.get("subtotal", 0))
    coupon = COUPONS.get(code)
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid coupon code")
    if subtotal < coupon.get("min_order", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order ₹{coupon['min_order']} required")
    if "discount_pct" in coupon:
        discount = subtotal * coupon["discount_pct"] / 100
    else:
        discount = coupon["discount_flat"]
    return {"code": code, "discount": round(discount, 2)}


# ============ AI FEATURES ============
QUIZ_SYSTEM_PROMPT = """You are HAKKIVEDA's expert Ayurvedic consultant. You analyze customer hair/skin quiz answers and provide:
1. A short personalized analysis (2-3 sentences) celebrating their unique profile
2. The doshas/concerns identified
3. 2-3 specific HAKKIVEDA product recommendations from this catalog:
- Hakkiveda Adivasi Herbal Hair Oil (500ml/250ml) - for hair growth, thickness, dandruff
- Hakkiveda Adivasi 30 Herb Shampoo - gentle herbal cleansing
- Hakkiveda Adivasi Pain Killer Oil - body pain relief
- Hakkiveda Beard Growth Oil - beard density
- Hakkiveda Tan & Pigmentation Removal Cream - dark spots, tan
- Hakkiveda Tan Removal & Whitening Soap - daily brightening
- Hakkiveda Anti-Mark Ayurvedic Cream - scars, blemishes
- Hakkiveda Body Wash for Skin Whitening & Tan Removal - body brightening

Respond ONLY in compact JSON: {"analysis": "...", "concerns": ["..."], "recommendations": [{"product_slug":"adivasi-herbal-hair-oil-500ml","reason":"..."}]}
Use these exact slugs: adivasi-herbal-hair-oil-500ml, adivasi-herbal-hair-oil-250ml, adivasi-30-herb-shampoo, adivasi-pain-killer-oil, beard-growth-oil, tan-pigmentation-removal-cream, tan-removal-whitening-soap, anti-mark-ayurvedic-cream, body-wash-skin-whitening
"""


@api_router.post("/quiz/submit")
async def submit_quiz(req: QuizSubmission):
    import json
    prompt = (
        f"Quiz type: {req.quiz_type}\n"
        f"Answers: {json.dumps(req.answers)}\n\n"
        "Provide personalized analysis and recommendations as JSON only."
    )
    try:
        if not genai_client:
            raise RuntimeError("GOOGLE_API_KEY is not configured")
        response = await genai_client.aio.models.generate_content(
            model=GEMINI_TEXT_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=QUIZ_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        text = (response.text or "").strip()
        # Strip markdown json fences if present (defensive — response_mime_type should prevent them)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        # enrich recommendations with full product details
        slugs = [r["product_slug"] for r in result.get("recommendations", [])]
        products = await db.products.find({"slug": {"$in": slugs}}, {"_id": 0}).to_list(10)
        pmap = {p["slug"]: p for p in products}
        enriched = []
        for r in result.get("recommendations", []):
            p = pmap.get(r["product_slug"])
            if p:
                enriched.append({**p, "reason": r.get("reason", "")})
        result["recommendations"] = enriched
        return result
    except Exception:
        logging.exception("Quiz AI error")
        # fallback recommendations
        fallback_slug = "adivasi-herbal-hair-oil-500ml" if req.quiz_type == "hair" else "tan-pigmentation-removal-cream"
        p = await db.products.find_one({"slug": fallback_slug}, {"_id": 0})
        return {
            "analysis": "Based on your responses, our Ayurvedic experts recommend a gentle herbal regimen rooted in Hakki Pikki tribal wisdom.",
            "concerns": ["general wellness"],
            "recommendations": [p] if p else [],
        }


CHAT_SYSTEM_PROMPT = """You are 'Vana', the warm, knowledgeable AI concierge for HAKKIVEDA — a premium Ayurvedic brand inspired by the Hakki Pikki tribe's herbal wisdom.

Keep replies concise (2-4 sentences), elegant, and helpful. You can:
- Recommend products from: Adivasi Herbal Hair Oil (500ml/250ml), 30 Herb Shampoo, Pain Killer Oil, Beard Growth Oil, Tan & Pigmentation Cream, Whitening Soap, Anti-Mark Cream, Body Wash
- Explain ingredients (amla, bhringraj, neem, turmeric, sandalwood, etc.)
- Help with orders, shipping (Pan India, free above ₹999), returns
- Share Ayurvedic wisdom

For order tracking, ask for order ID. For escalations, share WhatsApp: +91 76195 36831.
Always sound human and warm — never robotic.
"""


@api_router.post("/chat")
async def ai_chat(req: ChatMessage):
    try:
        if not genai_client:
            raise RuntimeError("GOOGLE_API_KEY is not configured")
        # Load prior turns for this session to preserve multi-turn context
        history_docs = await db.chat_history.find(
            {"session_id": req.session_id}, {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        contents = []
        for h in history_docs:
            role = "user" if h.get("role") == "user" else "model"
            contents.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part(text=h.get("text", ""))],
                )
            )
        contents.append(
            genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=req.message)],
            )
        )
        response = await genai_client.aio.models.generate_content(
            model=GEMINI_TEXT_MODEL,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_PROMPT,
            ),
        )
        reply = (response.text or "").strip()
        # Persist turn
        await db.chat_history.insert_one({"session_id": req.session_id, "role": "user", "text": req.message, "created_at": now_iso()})
        await db.chat_history.insert_one({"session_id": req.session_id, "role": "assistant", "text": reply, "created_at": now_iso()})
        return {"reply": reply}
    except Exception:
        logging.exception("Chat error")
        return {"reply": "I'm having trouble right now. Please WhatsApp us at +91 76195 36831 for immediate assistance."}


# ============ NEWSLETTER / CONTACT ============
@api_router.post("/newsletter")
async def newsletter(req: NewsletterSignup):
    await db.newsletter.update_one(
        {"email": req.email.lower()},
        {"$set": {"email": req.email.lower(), "subscribed_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.post("/contact")
async def contact(req: ContactMessage):
    doc = req.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.contact_messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


# ============ HEALTH ============
@api_router.get("/")
async def root():
    return {"brand": "HAKKIVEDA", "tagline": "Hakki Pikki Tribal Wisdom, Ayurvedic Healing"}


# ============ PAYMENT GATEWAY (Razorpay-ready) ============
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_ENABLED = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)


@api_router.get("/payments/config")
async def payments_config():
    return {
        "razorpay_enabled": RAZORPAY_ENABLED,
        "razorpay_key_id": RAZORPAY_KEY_ID if RAZORPAY_ENABLED else "",
        "cod_enabled": True,
        "mock_enabled": not RAZORPAY_ENABLED,
    }


@api_router.post("/payments/razorpay/create-order")
async def razorpay_create_order(body: Dict[str, Any], user=Depends(get_current_user)):
    if not RAZORPAY_ENABLED:
        raise HTTPException(503, "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable.")
    # Future: integrate razorpay SDK here when keys provided
    # import razorpay; client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    # order = client.order.create({"amount": int(body["amount"]*100), "currency":"INR","receipt": body["receipt"]})
    raise HTTPException(501, "Razorpay integration scaffold ready — uncomment SDK call when keys added")


# ============ EMAIL (Resend-ready) ============
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@hakkiveda.com")
EMAIL_ENABLED = bool(RESEND_API_KEY)


async def send_email(to: str, subject: str, html: str):
    """Email helper — sends via Resend when API key configured, else logs and skips."""
    if not EMAIL_ENABLED:
        logger.info(f"[EMAIL SKIPPED] to={to} subject='{subject}' (RESEND_API_KEY not set)")
        return {"skipped": True}
    try:
        import httpx
        async with httpx.AsyncClient() as c:
            r = await c.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                json={"from": EMAIL_FROM, "to": [to], "subject": subject, "html": html},
                timeout=10,
            )
            return r.json()
    except Exception as e:
        logger.exception(f"Email send failed: {e}")
        return {"error": str(e)}


# ============ ADMIN ENDPOINTS ============
UPLOADS_DIR = ROOT_DIR / "static" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), _=Depends(require_admin)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "png"
    if ext not in {"png", "jpg", "jpeg", "webp", "gif"}:
        raise HTTPException(400, "Unsupported file type")
    fname = f"{uuid.uuid4()}.{ext}"
    path = UPLOADS_DIR / fname
    content = await file.read()
    path.write_bytes(content)
    return {"url": f"/api/static/uploads/{fname}", "filename": fname, "size": len(content)}


@api_router.delete("/admin/upload/{filename}")
async def admin_delete_upload(filename: str, _=Depends(require_admin)):
    f = UPLOADS_DIR / filename
    if f.exists() and f.is_file():
        f.unlink()
    return {"ok": True}


# Products admin
@api_router.post("/admin/products")
async def admin_create_product(body: Dict[str, Any], _=Depends(require_admin)):
    body["id"] = str(uuid.uuid4())
    body["created_at"] = now_iso()
    body.setdefault("rating", 4.5)
    body.setdefault("review_count", 0)
    body.setdefault("featured", False)
    body.setdefault("best_seller", False)
    body.setdefault("stock", 100)
    await db.products.insert_one(body)
    body.pop("_id", None)
    return body


@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, body: Dict[str, Any], _=Depends(require_admin)):
    body.pop("_id", None); body.pop("id", None)
    res = await db.products.update_one({"id": product_id}, {"$set": body})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, _=Depends(require_admin)):
    await db.products.delete_one({"id": product_id})
    return {"ok": True}


# Orders admin
@api_router.get("/admin/orders")
async def admin_list_orders(_=Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, body: Dict[str, Any], _=Depends(require_admin)):
    new_status = body.get("status")
    stage_idx = body.get("stage_idx")  # 0..4
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(404, "Order not found")
    updates = {"status": new_status}
    if stage_idx is not None:
        stages = order.get("tracking_stages", [])
        for i, s in enumerate(stages):
            if i <= stage_idx:
                s["completed"] = True
                if not s.get("at"): s["at"] = now_iso()
        updates["tracking_stages"] = stages
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    return {"ok": True}


# Customers admin
@api_router.get("/admin/customers")
async def admin_list_customers(_=Depends(require_admin)):
    return await db.users.find({"is_admin": {"$ne": True}}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(500)


# Coupons admin
@api_router.get("/admin/coupons")
async def admin_list_coupons(_=Depends(require_admin)):
    items = await db.coupons.find({}, {"_id": 0}).to_list(200)
    # Merge with defaults
    for code, data in COUPONS.items():
        if not any(c["code"] == code for c in items):
            items.append({"code": code, **data, "active": True, "system": True})
    return items


@api_router.post("/admin/coupons")
async def admin_create_coupon(body: Dict[str, Any], _=Depends(require_admin)):
    body["code"] = body["code"].upper()
    body["created_at"] = now_iso()
    await db.coupons.update_one({"code": body["code"]}, {"$set": body}, upsert=True)
    COUPONS[body["code"]] = {k: v for k, v in body.items() if k in ("discount_pct", "discount_flat", "min_order")}
    return {"ok": True}


@api_router.delete("/admin/coupons/{code}")
async def admin_delete_coupon(code: str, _=Depends(require_admin)):
    code = code.upper()
    await db.coupons.delete_one({"code": code})
    COUPONS.pop(code, None)
    return {"ok": True}


# Newsletter, Contact, Reviews, Blog admin
@api_router.get("/admin/newsletter")
async def admin_newsletter(_=Depends(require_admin)):
    return await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(500)


@api_router.get("/admin/contact-messages")
async def admin_contact(_=Depends(require_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/admin/reviews")
async def admin_reviews(_=Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, _=Depends(require_admin)):
    await db.reviews.delete_one({"id": review_id})
    return {"ok": True}


@api_router.get("/admin/blog")
async def admin_blog_list(_=Depends(require_admin)):
    return await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/admin/blog")
async def admin_blog_create(body: Dict[str, Any], _=Depends(require_admin)):
    body["id"] = str(uuid.uuid4())
    body["created_at"] = now_iso()
    await db.blog_posts.insert_one(body)
    body.pop("_id", None)
    return body


@api_router.put("/admin/blog/{post_id}")
async def admin_blog_update(post_id: str, body: Dict[str, Any], _=Depends(require_admin)):
    body.pop("_id", None); body.pop("id", None)
    await db.blog_posts.update_one({"id": post_id}, {"$set": body})
    return {"ok": True}


@api_router.delete("/admin/blog/{post_id}")
async def admin_blog_delete(post_id: str, _=Depends(require_admin)):
    await db.blog_posts.delete_one({"id": post_id})
    return {"ok": True}


# Site content admin (homepage banners, SEO)
@api_router.get("/site-content/{key}")
async def get_site_content(key: str):
    doc = await db.site_content.find_one({"key": key}, {"_id": 0})
    return doc or {}


@api_router.put("/admin/site-content/{key}")
async def admin_update_site_content(key: str, body: Dict[str, Any], _=Depends(require_admin)):
    body["key"] = key
    body["updated_at"] = now_iso()
    await db.site_content.update_one({"key": key}, {"$set": body}, upsert=True)
    return {"ok": True}


# Admin profile / password
@api_router.put("/admin/profile")
async def admin_update_profile(body: Dict[str, Any], user=Depends(require_admin)):
    update = {}
    if "name" in body: update["name"] = body["name"]
    if "new_password" in body and body["new_password"]:
        update["password"] = hash_password(body["new_password"])
    if update:
        if "password" in update:
            update["must_change_password"] = False
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    return {"ok": True}


# Analytics summary
@api_router.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    agg = await db.orders.aggregate([{"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}]).to_list(1)
    total_revenue = agg[0]["total"] if agg else 0
    total_orders = agg[0]["count"] if agg else 0
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    customers = await db.users.count_documents({"is_admin": {"$ne": True}})
    products = await db.products.count_documents({})
    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_customers": customers,
        "total_products": products,
        "recent_orders": recent_orders,
    }


app.include_router(api_router)

# Static files for AI-generated brand imagery
static_dir = ROOT_DIR / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(static_dir)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ SEED ON STARTUP ============
SEED_PRODUCTS = [
    {
        "slug": "adivasi-herbal-hair-oil-500ml",
        "name": "Adivasi Herbal Hair Oil",
        "subtitle": "500 ml • Heritage Edition",
        "category": "hair-care",
        "price": 1499,
        "mrp": 2499,
        "rating": 4.8,
        "review_count": 1247,
        "featured": True,
        "best_seller": True,
        "tagline": "Ancestral formulation for thick, lustrous hair",
        "short_description": "A potent blend of 108 forest-foraged herbs cold-pressed in coconut and sesame oil, following the Hakki Pikki tribe's centuries-old recipe.",
        "ingredients": ["Bhringraj", "Amla", "Brahmi", "Hibiscus", "Curry Leaf", "Neem", "Methi", "Fenugreek", "Coconut Oil", "Sesame Oil"],
        "benefits": ["Reduces hair fall in 4 weeks", "Promotes new hair growth", "Eliminates dandruff", "Reverses premature greying", "Strengthens roots"],
        "directions": "Warm 2 tsp of oil. Massage gently into scalp in circular motions for 10 minutes. Leave overnight or for 2 hours. Wash with Hakkiveda 30 Herb Shampoo.",
        "suitable_for": "All hair types, all ages. Suitable for sensitive scalps.",
        "images": [
            "https://images.unsplash.com/photo-1608571702600-5a5419d31475?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [
            {"q": "How long until I see results?", "a": "Most users see reduced hair fall within 3-4 weeks of consistent use."},
            {"q": "Can men and women both use this?", "a": "Yes, suitable for all genders and hair types."},
            {"q": "Is it sticky?", "a": "Lightweight formulation that absorbs quickly without residue."},
        ],
    },
    {
        "slug": "adivasi-herbal-hair-oil-250ml",
        "name": "Adivasi Herbal Hair Oil",
        "subtitle": "250 ml • Travel Edition",
        "category": "hair-care",
        "price": 849,
        "mrp": 1299,
        "rating": 4.7,
        "review_count": 832,
        "featured": True,
        "best_seller": True,
        "tagline": "Our hero formula, in a travel-friendly size",
        "short_description": "The same 108-herb tribal formulation in a compact 250ml bottle. Perfect for first-time users.",
        "ingredients": ["Bhringraj", "Amla", "Brahmi", "Hibiscus", "Curry Leaf", "Neem", "Methi", "Coconut Oil", "Sesame Oil"],
        "benefits": ["Reduces hair fall", "Stimulates growth", "Anti-dandruff", "Stress-relief scalp massage"],
        "directions": "Warm and massage into scalp 2-3 times per week. Leave overnight for best results.",
        "suitable_for": "All hair types.",
        "images": [
            "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [
            {"q": "What is the shelf life?", "a": "24 months from manufacture date when stored in a cool, dry place."},
        ],
    },
    {
        "slug": "adivasi-30-herb-shampoo",
        "name": "Adivasi 30 Herb Shampoo",
        "subtitle": "200 ml • Sulphate-Free",
        "category": "hair-care",
        "price": 749,
        "mrp": 999,
        "rating": 4.6,
        "review_count": 612,
        "featured": True,
        "best_seller": False,
        "tagline": "Forest-foraged cleanse for everyday luxury",
        "short_description": "Sulphate-free, paraben-free shampoo with 30 medicinal herbs that cleanse gently while nourishing the scalp.",
        "ingredients": ["Shikakai", "Reetha", "Hibiscus", "Neem", "Tulsi", "Aloe Vera", "Bhringraj", "Amla", "Brahmi"],
        "benefits": ["Gentle daily cleanse", "Adds shine and softness", "Reduces frizz", "Soothes scalp irritation"],
        "directions": "Wet hair, lather a coin-sized amount, massage and rinse. Pair with Adivasi Hair Oil for best results.",
        "suitable_for": "Daily use, all hair types.",
        "images": [
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Is it color-safe?", "a": "Yes, gentle on coloured and chemically-treated hair."}],
    },
    {
        "slug": "adivasi-pain-killer-oil",
        "name": "Adivasi Pain Killer Oil",
        "subtitle": "100 ml • Therapeutic Blend",
        "category": "wellness",
        "price": 599,
        "mrp": 899,
        "rating": 4.7,
        "review_count": 421,
        "featured": False,
        "best_seller": True,
        "tagline": "Centuries-old relief, in every drop",
        "short_description": "A warming therapeutic oil with mahanarayan, gandhapura, and tribal herbs for joint pain, muscle stiffness, and inflammation.",
        "ingredients": ["Mahanarayan", "Gandhapura", "Eucalyptus", "Camphor", "Ginger", "Pippali"],
        "benefits": ["Relieves joint & muscle pain", "Reduces inflammation", "Warming relief", "Improves mobility"],
        "directions": "Apply 3-4 drops on affected area. Massage gently for 5 minutes. Use 2-3 times daily.",
        "suitable_for": "Adults. External use only.",
        "images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Safe for elderly?", "a": "Yes, gentle and non-greasy formulation safe for daily use."}],
    },
    {
        "slug": "beard-growth-oil",
        "name": "Beard Growth Oil",
        "subtitle": "50 ml • For Men",
        "category": "hair-care",
        "price": 549,
        "mrp": 799,
        "rating": 4.5,
        "review_count": 384,
        "featured": True,
        "best_seller": False,
        "tagline": "Dense, soft, defined — the Hakki way",
        "short_description": "Stimulates beard growth with a blend of tribal herbs, redensyl, and cold-pressed oils.",
        "ingredients": ["Bhringraj", "Brahmi", "Argan Oil", "Castor Oil", "Cedarwood", "Vitamin E"],
        "benefits": ["Promotes beard density", "Softens coarse hair", "Reduces patchy growth", "Adds healthy shine"],
        "directions": "Apply 4-5 drops daily on clean beard. Massage thoroughly. Use morning or night.",
        "suitable_for": "Men, all skin types.",
        "images": [
            "https://images.unsplash.com/photo-1583241800698-9c2e09be0a55?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "When will I see results?", "a": "Visible density within 6-8 weeks of daily use."}],
    },
    {
        "slug": "tan-pigmentation-removal-cream",
        "name": "Tan & Pigmentation Removal Cream",
        "subtitle": "100 g • Brightening",
        "category": "skin-care",
        "price": 699,
        "mrp": 1199,
        "rating": 4.6,
        "review_count": 528,
        "featured": True,
        "best_seller": True,
        "tagline": "Reveal your natural luminescence",
        "short_description": "Ayurvedic brightening cream with kojic acid, saffron, and licorice root that fades tan, pigmentation, and dark spots.",
        "ingredients": ["Saffron", "Licorice Root", "Kojic Acid", "Sandalwood", "Turmeric", "Aloe Vera"],
        "benefits": ["Fades stubborn tan & pigmentation", "Evens skin tone", "Hydrates deeply", "Suitable for face & body"],
        "directions": "Apply twice daily on cleansed skin. Use sunscreen during the day. Visible results in 4-6 weeks.",
        "suitable_for": "All skin types including sensitive.",
        "images": [
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Is it safe for daily use?", "a": "Yes, dermatologically tested for daily application."}],
    },
    {
        "slug": "tan-removal-whitening-soap",
        "name": "Tan Removal & Whitening Soap",
        "subtitle": "100 g • Handcrafted",
        "category": "skin-care",
        "price": 249,
        "mrp": 399,
        "rating": 4.4,
        "review_count": 297,
        "featured": False,
        "best_seller": False,
        "tagline": "Daily ritual for luminous skin",
        "short_description": "Handcrafted soap with sandalwood, papaya, and milk cream for daily tan removal and skin brightening.",
        "ingredients": ["Sandalwood", "Papaya", "Milk Cream", "Saffron", "Turmeric"],
        "benefits": ["Gentle daily brightening", "Removes tan & dullness", "Moisturizes naturally", "No harsh chemicals"],
        "directions": "Use daily in shower. Lather on damp skin, massage, rinse.",
        "suitable_for": "All skin types.",
        "images": [
            "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Is this soap or face wash?", "a": "Bar soap suitable for face and body."}],
    },
    {
        "slug": "anti-mark-ayurvedic-cream",
        "name": "Anti-Mark Ayurvedic Cream",
        "subtitle": "10 g • Targeted Treatment",
        "category": "skin-care",
        "price": 349,
        "mrp": 499,
        "rating": 4.5,
        "review_count": 218,
        "featured": False,
        "best_seller": False,
        "tagline": "Fade scars, reveal clear skin",
        "short_description": "Concentrated formula for acne marks, dark spots, and minor blemishes with tribal herbs and rose otto.",
        "ingredients": ["Manjistha", "Rose Otto", "Vitamin C", "Niacinamide", "Aloe Vera"],
        "benefits": ["Fades acne scars", "Lightens dark spots", "Smooths texture", "Lightweight & non-comedogenic"],
        "directions": "Apply a pea-sized amount on affected area twice daily. Massage gently until absorbed.",
        "suitable_for": "Acne-prone, blemish-prone skin.",
        "images": [
            "https://images.unsplash.com/photo-1620916297893-25ce2a4ba9b3?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Will it work on old scars?", "a": "Yes, but expect 8-12 weeks for older scars."}],
    },
    {
        "slug": "body-wash-skin-whitening",
        "name": "Body Wash for Skin Whitening & Tan Removal",
        "subtitle": "250 ml • Luxurious",
        "category": "skin-care",
        "price": 499,
        "mrp": 749,
        "rating": 4.5,
        "review_count": 312,
        "featured": True,
        "best_seller": False,
        "tagline": "Spa-grade indulgence, every day",
        "short_description": "Silky body wash with charcoal, papaya, and licorice that gently cleanses while brightening dull, tanned skin.",
        "ingredients": ["Activated Charcoal", "Papaya", "Licorice", "Aloe Vera", "Lavender Oil"],
        "benefits": ["Detoxifies & brightens", "Fades body tan", "Moisturizes", "Spa-grade fragrance"],
        "directions": "Apply on wet skin in shower, lather, rinse. Use daily.",
        "suitable_for": "Daily use, all skin types.",
        "images": [
            "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=900&q=80",
        ],
        "faqs": [{"q": "Is it safe for sensitive skin?", "a": "Yes, sulphate-free and dermatologist-tested."}],
    },
]


SEED_REVIEWS = [
    {"product_slug": "adivasi-herbal-hair-oil-500ml", "user_name": "Priya Sharma", "rating": 5, "title": "Transformed my hair in 6 weeks!", "comment": "I had severe hair fall after pregnancy. This oil is a miracle - my baby hairs are growing back and my hair feels thicker. The earthy smell takes getting used to but the results are incredible."},
    {"product_slug": "adivasi-herbal-hair-oil-500ml", "user_name": "Rahul Verma", "rating": 5, "title": "Stopped my premature greying", "comment": "Used consistently for 3 months. My greys at 28 have noticeably reduced. Authentic tribal formulation - you can feel the herbs working."},
    {"product_slug": "adivasi-herbal-hair-oil-500ml", "user_name": "Anjali Iyer", "rating": 4, "title": "Worth every rupee", "comment": "Love how my hair feels - soft, shiny, and the scalp is no longer itchy. Pricey but the bottle lasts long."},
    {"product_slug": "tan-pigmentation-removal-cream", "user_name": "Meera Krishnan", "rating": 5, "title": "Pigmentation faded in 2 months", "comment": "Years of melasma started fading. Skin feels even-toned for the first time in years. So grateful!"},
    {"product_slug": "adivasi-30-herb-shampoo", "user_name": "Karthik Reddy", "rating": 5, "title": "Best shampoo I've used", "comment": "No more dandruff, hair feels lighter and shinier. Worth switching from chemical shampoos."},
    {"product_slug": "beard-growth-oil", "user_name": "Aditya Singh", "rating": 4, "title": "Filled patchy areas", "comment": "Used for 2 months — patchy beard is now uniform. Light, non-sticky formula."},
    {"product_slug": "adivasi-pain-killer-oil", "user_name": "Lakshmi Devi", "rating": 5, "title": "Relief for my arthritis", "comment": "My mother's knee pain reduced significantly. Warming and effective."},
]


@app.on_event("startup")
async def startup():
    # Seed admin
    admin_email = "hakkiveda@gmail.com"
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "HAKKIVEDA Admin",
            "email": admin_email,
            "password": hash_password("Hakki@Admin2026"),
            "is_admin": True,
            "must_change_password": True,
            "addresses": [], "wishlist": [], "cart": [], "reward_points": 0,
            "created_at": now_iso(),
        })
        logger.info("Admin seeded: admin@hakkiveda.com")
    # Seed site_content
    if not await db.site_content.find_one({"key": "homepage"}):
        await db.site_content.insert_one({
            "key": "homepage",
            "hero_title": "The forest's centuries-old secret to wellness.",
            "hero_subtitle": "Hakki Pikki tribal wisdom, distilled into modern Ayurvedic rituals for hair, skin, and soul.",
            "hero_cta_primary": "Shop the Collection",
            "hero_cta_secondary": "Our Heritage",
            "announcement": "Free Pan India Delivery on orders above ₹999 · COD Available",
            "updated_at": now_iso(),
        })
    count = await db.products.count_documents({})
    if count == 0:
        docs = []
        for p in SEED_PRODUCTS:
            d = {**p, "id": str(uuid.uuid4()), "created_at": now_iso()}
            docs.append(d)
        await db.products.insert_many(docs)
        # seed reviews
        prod_map = {p["slug"]: p["id"] for p in docs}
        rdocs = []
        for r in SEED_REVIEWS:
            pid = prod_map.get(r["product_slug"])
            if pid:
                rdocs.append({
                    "id": str(uuid.uuid4()),
                    "product_id": pid,
                    "user_id": "seed",
                    "user_name": r["user_name"],
                    "rating": r["rating"],
                    "title": r["title"],
                    "comment": r["comment"],
                    "verified": True,
                    "created_at": now_iso(),
                })
        if rdocs:
            await db.reviews.insert_many(rdocs)
        logger.info(f"Seeded {len(docs)} products and {len(rdocs)} reviews")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
