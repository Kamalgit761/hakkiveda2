# HAKKIVEDA — Deployment Guide (Hostinger VPS)

## 1. Admin Access
- **URL**: `https://yourdomain.com/admin`
- **Email**: `admin@hakkiveda.com`
- **Password**: `Hakki@Admin2026` *(change immediately after first login via Profile tab)*

## 2. Complete Feature Checklist

### Customer-Facing ✅
- [x] Homepage with hero, marquee, best sellers, collections, AI quiz CTA, heritage, ingredients, testimonials
- [x] Shop with category filter, search, sort
- [x] Product detail (gallery, accordion, reviews, related, JSON-LD schema)
- [x] Cart, Wishlist
- [x] Checkout (COD + Mock online + coupons), HKV-prefixed orders, free shipping above ₹999
- [x] JWT auth (Register, Login, Forgot Password)
- [x] Account dashboard (Orders, Addresses, Profile, Wishlist tabs)
- [x] Order Tracking (5 stages)
- [x] AI Hair Quiz, AI Skin Quiz (Claude Sonnet 4.5)
- [x] AI Chatbot "Vana" floating (Claude Sonnet 4.5)
- [x] About/Heritage, Contact (with form), Blog list, 404
- [x] Floating WhatsApp (+91 76195 36831), Call, AI Chat — site-wide
- [x] SEO: meta tags, OG, Twitter Cards, JSON-LD, sitemap.xml, robots.txt

### Admin Dashboard ✅ (`/admin`)
- [x] Dashboard with revenue/orders/customers/products stats + recent orders
- [x] Products CRUD with multi-image upload (local disk, persistent)
- [x] Orders management with status progression
- [x] Customers list
- [x] Coupons CRUD (percent + flat, min order)
- [x] Newsletter subscribers viewer
- [x] Contact form messages viewer
- [x] Reviews moderation (delete)
- [x] Blog CRUD
- [x] Homepage / SEO content editor (announcement bar, hero text, SEO meta)
- [x] Admin Profile (name + password change)

### Deferred (just plug in when ready)
- [ ] Razorpay live payments (mock_online + COD active now)
- [ ] Transactional emails (Resend/SendGrid)
- [ ] AI image regeneration UI (script available: `python backend/generate_images.py`)

## 3. Environment Variables

### `/app/backend/.env`
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hakkiveda_db"
CORS_ORIGINS="https://yourdomain.com"
EMAIL_FROM=noreply@hakkiveda.com
GOOGLE_API_KEY=AIza...your_google_ai_studio_key   # for Gemini 2.5 Flash (chat/quiz) + Gemini 2.5 Flash Image
JWT_SECRET=<generate strong random string>
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=168
# Future:
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# RESEND_API_KEY=
```

### `/app/frontend/.env`
```
REACT_APP_BACKEND_URL=https://yourdomain.com   # backend public URL
```

## 4. Railway Deployment (recommended for quick start)

The project ships with `backend/railway.json`, `backend/Procfile`, and `backend/runtime.txt` so Railway picks up everything automatically.

### Backend service
1. New Project → Deploy from GitHub repo → pick `backend/` as the root directory.
2. Add environment variables in Railway dashboard:
   - `MONGO_URL` — connect a Railway MongoDB add-on or your Atlas URL
   - `DB_NAME=hakkiveda_db`
   - `CORS_ORIGINS=https://your-frontend.up.railway.app`
   - `GOOGLE_API_KEY=AIza...` (from https://aistudio.google.com/app/apikey)
   - `JWT_SECRET=<long random string>`
   - `JWT_ALGORITHM=HS256`
   - `JWT_EXPIRY_HOURS=168`
3. Deploy. Note the public URL it gives you (e.g. `https://hakkiveda-backend.up.railway.app`).

### Frontend service
1. New Project → Deploy from same GitHub repo → pick `frontend/` as the root directory.
2. Add environment variable:
   - `REACT_APP_BACKEND_URL=https://hakkiveda-backend.up.railway.app`
3. Deploy.

### MongoDB
Either add the Railway MongoDB plugin (free starter tier) or use MongoDB Atlas. Update `MONGO_URL` accordingly.

## 5. Hostinger VPS Deployment

### One-time setup
```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y python3.11 python3-pip nodejs npm nginx mongodb
sudo npm install -g yarn pm2

# 2. Clone or upload code to /var/www/hakkiveda
cd /var/www/hakkiveda

# 3. Backend
cd backend
pip3 install -r requirements.txt
# Edit .env with production values

# 4. Frontend build
cd ../frontend
yarn install
yarn build      # outputs /build directory

# 5. MongoDB — already runs on localhost:27017 by default
sudo systemctl enable mongodb && sudo systemctl start mongodb
```

### Run services with PM2
```bash
# Backend (FastAPI via uvicorn)
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name hk-backend --cwd /var/www/hakkiveda/backend

# Frontend static is served by nginx (see below)
pm2 save
pm2 startup
```

### Nginx Config (`/etc/nginx/sites-available/hakkiveda`)
```nginx
server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;

  # Frontend (React build)
  root /var/www/hakkiveda/frontend/build;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  # Backend API
  location /api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 20M;       # for image uploads
  }
}
```
Then: `sudo ln -s /etc/nginx/sites-available/hakkiveda /etc/nginx/sites-enabled/ && sudo certbot --nginx && sudo systemctl reload nginx`

## 5. Database

### Setup
- MongoDB runs on `localhost:27017` (default)
- DB: `hakkiveda_db` (auto-created on first write)
- Collections auto-created: `users`, `products`, `orders`, `reviews`, `cart`, `wishlist`, `newsletter`, `contact_messages`, `blog_posts`, `site_content`, `chat_history`, `coupons`
- On first backend start: admin user + 9 products + 7 reviews + homepage content are seeded

### Backup (run daily via cron)
```bash
mongodump --db=hakkiveda_db --out=/var/backups/mongo/$(date +%F)
# Or compressed:
mongodump --db=hakkiveda_db --archive=/var/backups/hakkiveda-$(date +%F).gz --gzip
```

### Restore
```bash
mongorestore --db=hakkiveda_db /var/backups/mongo/2026-02-15/hakkiveda_db
# Or from archive:
mongorestore --archive=/var/backups/hakkiveda-2026-02-15.gz --gzip
```

### Backup uploaded files
```bash
tar -czf /var/backups/uploads-$(date +%F).tar.gz /var/www/hakkiveda/backend/static/
```

## 6. Post-Deployment Checklist
1. Visit https://yourdomain.com → homepage loads
2. Visit /admin → login with admin@hakkiveda.com / Hakki@Admin2026
3. **Change admin password** in Profile tab
4. Edit Homepage tab → set your announcement and SEO meta
5. Test order flow with COD
6. Verify WhatsApp button opens wa.me/917619536831
7. Submit sitemap.xml to Google Search Console
8. When ready: add Razorpay keys → I can switch mock → live in ~15 min

## 7. Test Reports
- `/app/test_reports/iteration_1.json` — Phase 1 (customer features) ✅
- `/app/test_reports/iteration_2.json` — Phase 2 (AI images + SEO) ✅
- `/app/test_reports/iteration_3.json` — Phase 3 (Admin Dashboard) ✅
