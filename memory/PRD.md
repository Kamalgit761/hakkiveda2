# HAKKIVEDA — Product Requirements Doc

## Original Problem Statement
Make HAKKIVEDA completely independent of Emergent so it can be deployed on Railway and Hostinger VPS.

### Key migration goals
1. Remove `emergentintegrations==0.2.0` and all `from emergentintegrations.llm.chat import LlmChat, UserMessage` usages.
2. Replace with the official **google-genai** SDK.
3. Use **Gemini 2.5 Flash** for AI Chat and AI Hair/Skin Quiz.
4. Use **Gemini 2.5 Flash Image (preview)** for brand image generation.
5. Replace `EMERGENT_LLM_KEY` env var with `GOOGLE_API_KEY` everywhere.
6. Project must deploy on Railway and Hostinger VPS using public PyPI packages only.

## Tech Stack
- **Backend**: FastAPI + Motor (async MongoDB) + JWT auth + google-genai SDK
- **Frontend**: React + craco + Tailwind + Radix UI
- **DB**: MongoDB (Atlas or self-hosted)
- **AI**: Google Gemini 2.5 Flash (text) + Gemini 2.5 Flash Image (preview)

## User Personas
- **Customer**: shops products, takes Hair/Skin AI quiz, chats with "Vana" concierge, places COD/mock orders.
- **Admin** (`hakkiveda@gmail.com`): manages products, orders, customers, coupons, blog, reviews, site content, profile.

## Core Requirements (live & working)
- Auth (register/login/forgot-password/JWT)
- Products catalogue (9 seeded) with category, search, featured, best-sellers, detail w/ reviews + related
- Cart, Wishlist, Addresses
- Checkout (COD + mock online) → HKV-prefixed orders → 5-stage tracking
- Coupons (TRIBAL10 10%, AYUR20 20% min ₹1500, HAKKI500 ₹500 flat min ₹2500)
- Reviews (auth)
- AI Hair/Skin Quiz (Gemini 2.5 Flash) with graceful fallback when key missing
- AI Chat "Vana" (Gemini 2.5 Flash) with multi-turn context from MongoDB history
- Newsletter, Contact
- Admin Dashboard: stats, products CRUD, orders + status, customers, coupons CRUD, newsletter, contact, reviews moderation, blog CRUD, site content, profile, image upload
- Payments config endpoint (Razorpay ready, currently mock + COD)
- Razorpay & Resend email scaffolds (plug in keys to enable)
- Brand image generation via `backend/generate_images.py` (Gemini 2.5 Flash Image)

## What's been implemented in this iteration (2026-06-29)
- ✅ Cloned uploaded HAKKIVEDA project into `/app`.
- ✅ Removed `emergentintegrations==0.2.0` from `requirements.txt`; uninstalled from venv.
- ✅ Added `google-genai>=0.8.0`, `httpx`, `pillow` to `requirements.txt`.
- ✅ Refactored `backend/server.py`:
  - Replaced `from emergentintegrations.llm.chat import LlmChat, UserMessage` with `from google import genai` + `from google.genai import types as genai_types`.
  - Replaced `EMERGENT_LLM_KEY` with `GOOGLE_API_KEY`; create `genai_client` only if key present.
  - Migrated `/api/quiz/submit` to `client.aio.models.generate_content` with `system_instruction=QUIZ_SYSTEM_PROMPT` and `response_mime_type='application/json'`.
  - Migrated `/api/chat` to multi-turn via `genai_types.Content` history loaded from MongoDB.
- ✅ Refactored `backend/generate_images.py` to use `gemini-2.5-flash-image-preview` via `client.aio.models.generate_content` with `response_modalities=['IMAGE','TEXT']`.
- ✅ Created `backend/.env.example`, `frontend/.env.example`.
- ✅ Created Railway deployment files: `backend/Procfile`, `backend/runtime.txt`, `backend/railway.json`, `frontend/railway.json`.
- ✅ Updated `DEPLOYMENT.md` — `EMERGENT_LLM_KEY` → `GOOGLE_API_KEY`, added a full Railway section.
- ✅ Verified backend imports cleanly and starts (admin + 9 products + 7 reviews + homepage content seeded).
- ✅ All 36 backend tests pass via testing agent (/app/test_reports/iteration_migration_1.json).
- ✅ Verified `google-genai` SDK actually reaches Google's API (rejected dummy key with 400 INVALID_ARGUMENT — code path correct).
- ✅ Frontend builds and loads against the migrated backend.
- ✅ Final scan confirms ZERO `emergentintegrations`, `EMERGENT_LLM_KEY`, or `LlmChat` references in code, requirements, env files, or docs.

## Backlog / Next Action Items (for the user)
- **P0**: Add real `GOOGLE_API_KEY` (https://aistudio.google.com/app/apikey) to Railway/Hostinger env to enable live AI Chat & Quiz.
- **P0**: Use the chat input's **Save to GitHub** button to push these migration changes to `https://github.com/Kamalgit761/hakkiveda1`.
- **P1**: Deploy backend to Railway with the provided `backend/railway.json` and frontend to Railway/Vercel/Hostinger.
- **P1**: Add Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) to enable live payments — scaffold already present.
- **P1**: Add Resend key (`RESEND_API_KEY`) to enable transactional order-confirmation emails.
- **P2** (optional improvements suggested by testing agent):
  - Replace `Dict[str, Any]` admin bodies with Pydantic models.
  - Cap `chat_history` to last N turns per session.
  - Split `server.py` into routers (auth/products/cart/orders/admin/ai).
- **P2**: Re-run a smoke test against `/api/chat` and `/api/quiz/submit` once `GOOGLE_API_KEY` is set in Railway.
