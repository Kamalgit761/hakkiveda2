"""HAKKIVEDA migration regression tests (google-genai migration).

Covers: Public endpoints, Auth, Cart, Wishlist, Addresses, Checkout, Orders,
Coupons, Reviews, Newsletter, Contact, AI Chat/Quiz fallbacks (no GOOGLE_API_KEY),
Admin endpoints, Admin CRUD, Image upload, Payments config.
"""
import io
import os
import time
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "hakkiveda@gmail.com"
ADMIN_PASSWORD = "Hakki@Admin2026"
TS = str(int(time.time()))
USER_EMAIL = f"testuser+{TS}@example.com"
USER_PASSWORD = "TestPass123!"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"].get("is_admin") is True
    return data["token"]


@pytest.fixture(scope="session")
def user_token(s):
    r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": USER_EMAIL, "password": USER_PASSWORD})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return r.json()["token"]


def H(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public ----------------
class TestPublic:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["brand"] == "HAKKIVEDA"

    def test_products_list(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 9, f"Expected 9 seeded products, got {len(data)}"

    def test_products_featured(self, s):
        r = s.get(f"{API}/products/featured")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_products_best_sellers(self, s):
        r = s.get(f"{API}/products/best-sellers")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_product_detail_with_related_and_reviews(self, s):
        # use a known seeded slug
        r = s.get(f"{API}/products/adivasi-herbal-hair-oil-500ml")
        assert r.status_code == 200
        p = r.json()
        assert "related" in p and isinstance(p["related"], list)
        assert "reviews" in p and isinstance(p["reviews"], list)

    def test_site_content_homepage(self, s):
        r = s.get(f"{API}/site-content/homepage")
        assert r.status_code == 200
        data = r.json()
        assert data.get("key") == "homepage"

    def test_payments_config(self, s):
        r = s.get(f"{API}/payments/config")
        assert r.status_code == 200
        d = r.json()
        assert d["razorpay_enabled"] is False
        assert d["cod_enabled"] is True
        assert d["mock_enabled"] is True


# ---------------- Auth ----------------
class TestAuth:
    def test_register_and_login(self, s, user_token):
        assert user_token  # already registered via fixture
        r = s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == USER_EMAIL

    def test_admin_login(self, admin_token):
        assert admin_token

    def test_me(self, s, user_token):
        r = s.get(f"{API}/auth/me", headers=H(user_token))
        assert r.status_code == 200
        assert r.json()["email"] == USER_EMAIL

    def test_forgot_password(self, s):
        # register a throwaway user
        email = f"fp+{TS}@example.com"
        s.post(f"{API}/auth/register", json={"name": "FP", "email": email, "password": "OldPass1!"})
        r = s.post(f"{API}/auth/forgot-password", json={"email": email, "new_password": "NewPass1!"})
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # login with new
        r2 = s.post(f"{API}/auth/login", json={"email": email, "password": "NewPass1!"})
        assert r2.status_code == 200


# ---------------- Cart / Wishlist / Addresses ----------------
class TestCartWishlistAddress:
    @pytest.fixture(scope="class")
    def product_id(self, s):
        r = s.get(f"{API}/products")
        return r.json()[0]["id"]

    def test_cart_flow(self, s, user_token, product_id):
        r = s.post(f"{API}/cart", json={"product_id": product_id, "qty": 2}, headers=H(user_token))
        assert r.status_code == 200
        r2 = s.get(f"{API}/cart", headers=H(user_token))
        assert r2.status_code == 200
        items = r2.json()
        assert any(i["id"] == product_id and i["qty"] == 2 for i in items)
        # update qty
        s.post(f"{API}/cart", json={"product_id": product_id, "qty": 3}, headers=H(user_token))
        r3 = s.get(f"{API}/cart", headers=H(user_token))
        assert any(i["qty"] == 3 for i in r3.json())

    def test_wishlist_toggle(self, s, user_token, product_id):
        r = s.post(f"{API}/wishlist", json={"product_id": product_id}, headers=H(user_token))
        assert r.status_code == 200
        assert product_id in r.json()["wishlist"]
        r2 = s.get(f"{API}/wishlist", headers=H(user_token))
        assert r2.status_code == 200
        # toggle off
        r3 = s.post(f"{API}/wishlist", json={"product_id": product_id}, headers=H(user_token))
        assert product_id not in r3.json()["wishlist"]

    def test_addresses(self, s, user_token):
        addr = {
            "id": str(uuid.uuid4()),
            "full_name": "Test User", "phone": "9999999999",
            "line1": "1 Test St", "city": "Mumbai", "state": "MH", "pincode": "400001",
            "is_default": True
        }
        r = s.post(f"{API}/addresses", json=addr, headers=H(user_token))
        assert r.status_code == 200
        addresses = r.json()["addresses"]
        assert len(addresses) >= 1
        aid = addresses[-1]["id"]
        r2 = s.delete(f"{API}/addresses/{aid}", headers=H(user_token))
        assert r2.status_code == 200


# ---------------- Coupons ----------------
class TestCoupons:
    def test_tribal10(self, s):
        r = s.post(f"{API}/validate-coupon", json={"code": "TRIBAL10", "subtotal": 1000})
        assert r.status_code == 200
        assert r.json()["discount"] == 100.0

    def test_ayur20_min(self, s):
        r = s.post(f"{API}/validate-coupon", json={"code": "AYUR20", "subtotal": 1000})
        assert r.status_code == 400
        r2 = s.post(f"{API}/validate-coupon", json={"code": "AYUR20", "subtotal": 1600})
        assert r2.status_code == 200
        assert r2.json()["discount"] == 320.0

    def test_hakki500_min(self, s):
        r = s.post(f"{API}/validate-coupon", json={"code": "HAKKI500", "subtotal": 2000})
        assert r.status_code == 400
        r2 = s.post(f"{API}/validate-coupon", json={"code": "HAKKI500", "subtotal": 3000})
        assert r2.status_code == 200
        assert r2.json()["discount"] == 500


# ---------------- Checkout / Orders ----------------
class TestCheckoutOrders:
    def test_checkout_creates_hkv_order(self, s, user_token):
        # add a product
        prod = s.get(f"{API}/products").json()[0]
        s.post(f"{API}/cart", json={"product_id": prod["id"], "qty": 1}, headers=H(user_token))
        body = {
            "address": {
                "id": str(uuid.uuid4()),
                "full_name": "Test User", "phone": "9999999999",
                "line1": "1 Test St", "city": "Mumbai", "state": "MH", "pincode": "400001",
                "is_default": True
            },
            "payment_method": "cod",
        }
        r = s.post(f"{API}/checkout", json=body, headers=H(user_token))
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["id"].startswith("HKV")
        assert order["status"] == "confirmed"
        return order["id"]

    def test_list_and_get_order(self, s, user_token):
        # Ensure at least one order exists from prior test
        prod = s.get(f"{API}/products").json()[0]
        s.post(f"{API}/cart", json={"product_id": prod["id"], "qty": 1}, headers=H(user_token))
        body = {
            "address": {"id": str(uuid.uuid4()), "full_name": "T", "phone": "1", "line1": "x", "city": "x", "state": "x", "pincode": "1"},
            "payment_method": "cod"
        }
        s.post(f"{API}/checkout", json=body, headers=H(user_token))
        r = s.get(f"{API}/orders", headers=H(user_token))
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) >= 1
        oid = orders[0]["id"]
        r2 = s.get(f"{API}/orders/{oid}", headers=H(user_token))
        assert r2.status_code == 200
        assert r2.json()["id"] == oid


# ---------------- Reviews / Newsletter / Contact ----------------
class TestMisc:
    def test_review_create(self, s, user_token):
        pid = s.get(f"{API}/products").json()[0]["id"]
        r = s.post(f"{API}/reviews", json={"product_id": pid, "rating": 5, "title": "Great", "comment": "Loved it"}, headers=H(user_token))
        assert r.status_code == 200
        assert r.json()["rating"] == 5

    def test_newsletter(self, s):
        r = s.post(f"{API}/newsletter", json={"email": f"news+{TS}@example.com"})
        assert r.status_code == 200

    def test_contact(self, s):
        r = s.post(f"{API}/contact", json={
            "name": "Test", "email": f"contact+{TS}@example.com",
            "subject": "Hello", "message": "Test msg"
        })
        assert r.status_code == 200
        assert "id" in r.json()


# ---------------- AI Fallbacks (GOOGLE_API_KEY empty) ----------------
class TestAIFallbacks:
    def test_chat_fallback(self, s):
        r = s.post(f"{API}/chat", json={"session_id": "test-session", "message": "Hello Vana"})
        assert r.status_code == 200, r.text
        reply = r.json()["reply"]
        assert "WhatsApp" in reply or "+91 76195 36831" in reply, f"Unexpected reply: {reply}"

    def test_quiz_fallback_hair(self, s):
        r = s.post(f"{API}/quiz/submit", json={"quiz_type": "hair", "answers": {"concern": "hair fall"}})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "analysis" in d
        assert "recommendations" in d
        assert len(d["recommendations"]) >= 1

    def test_quiz_fallback_skin(self, s):
        r = s.post(f"{API}/quiz/submit", json={"quiz_type": "skin", "answers": {"concern": "pigmentation"}})
        assert r.status_code == 200
        assert len(r.json()["recommendations"]) >= 1


# ---------------- Admin ----------------
class TestAdmin:
    def test_admin_requires_token(self, s):
        r = s.get(f"{API}/admin/stats")
        assert r.status_code in (401, 403)

    def test_admin_stats(self, s, admin_token):
        r = s.get(f"{API}/admin/stats", headers=H(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ("total_orders", "total_revenue", "total_customers", "total_products"):
            assert k in d

    def test_admin_lists(self, s, admin_token):
        for path in ["orders", "customers", "coupons", "newsletter", "contact-messages", "reviews", "blog"]:
            r = s.get(f"{API}/admin/{path}", headers=H(admin_token))
            assert r.status_code == 200, f"{path} -> {r.status_code}"
            assert isinstance(r.json(), list)

    def test_admin_forbidden_for_user(self, s, user_token):
        r = s.get(f"{API}/admin/stats", headers=H(user_token))
        assert r.status_code == 403

    def test_admin_products_crud(self, s, admin_token):
        body = {
            "slug": f"test-product-{TS}", "name": "TEST_Product", "category": "skin-care",
            "price": 100, "mrp": 200, "images": [], "ingredients": [], "benefits": []
        }
        r = s.post(f"{API}/admin/products", json=body, headers=H(admin_token))
        assert r.status_code == 200
        pid = r.json()["id"]
        r2 = s.put(f"{API}/admin/products/{pid}", json={"price": 150}, headers=H(admin_token))
        assert r2.status_code == 200
        r3 = s.delete(f"{API}/admin/products/{pid}", headers=H(admin_token))
        assert r3.status_code == 200

    def test_admin_coupons_crud(self, s, admin_token):
        code = f"TEST{TS}"
        r = s.post(f"{API}/admin/coupons", json={"code": code, "discount_pct": 5, "min_order": 0}, headers=H(admin_token))
        assert r.status_code == 200
        r2 = s.delete(f"{API}/admin/coupons/{code}", headers=H(admin_token))
        assert r2.status_code == 200

    def test_admin_order_status(self, s, admin_token, user_token):
        # ensure an order exists
        prod = s.get(f"{API}/products").json()[0]
        s.post(f"{API}/cart", json={"product_id": prod["id"], "qty": 1}, headers=H(user_token))
        body = {
            "address": {"id": str(uuid.uuid4()), "full_name": "T", "phone": "1", "line1": "x", "city": "x", "state": "x", "pincode": "1"},
            "payment_method": "cod"
        }
        oid = s.post(f"{API}/checkout", json=body, headers=H(user_token)).json()["id"]
        r = s.put(f"{API}/admin/orders/{oid}/status", json={"status": "shipped", "stage_idx": 2}, headers=H(admin_token))
        assert r.status_code == 200

    def test_admin_blog_crud(self, s, admin_token):
        r = s.post(f"{API}/admin/blog", json={"title": "TEST_Blog", "content": "Hello"}, headers=H(admin_token))
        assert r.status_code == 200
        pid = r.json()["id"]
        r2 = s.put(f"{API}/admin/blog/{pid}", json={"title": "Updated"}, headers=H(admin_token))
        assert r2.status_code == 200
        r3 = s.delete(f"{API}/admin/blog/{pid}", headers=H(admin_token))
        assert r3.status_code == 200

    def test_admin_site_content_update(self, s, admin_token):
        r = s.put(f"{API}/admin/site-content/homepage", json={"announcement": f"Test {TS}"}, headers=H(admin_token))
        assert r.status_code == 200

    def test_admin_profile_update(self, s, admin_token):
        r = s.put(f"{API}/admin/profile", json={"name": "HAKKIVEDA Admin"}, headers=H(admin_token))
        assert r.status_code == 200

    def test_admin_upload_and_delete(self, s, admin_token):
        # 1x1 png
        png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000000500010d0a2db40000000049454e44ae426082")
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = s.post(f"{API}/admin/upload", files=files, headers=H(admin_token))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/static/uploads/")
        # static fetch
        full = f"{BASE_URL}{d['url']}"
        rs = s.get(full)
        assert rs.status_code == 200
        # delete
        rd = s.delete(f"{API}/admin/upload/{d['filename']}", headers=H(admin_token))
        assert rd.status_code == 200
