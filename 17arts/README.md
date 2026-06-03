# 17ARTS — India's Premier Art Marketplace

> A full-stack e-commerce website for buying and selling authentic Indian artworks.

![17ARTS](https://img.shields.io/badge/17ARTS-Art%20Marketplace-B8972A?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![Express](https://img.shields.io/badge/Express-4.x-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 Art Marketplace | Home, Collection, Product Detail pages |
| 🛒 Shopping | Cart, Checkout, Order tracking |
| 👤 Auth | Register, Login, JWT sessions |
| 📦 Orders | Full order management & status updates |
| ❤️ Wishlist | Save favourite artworks |
| 🏠 Addresses | Multiple saved delivery addresses |
| 🔐 Admin Panel | Manage artworks, orders, users |
| 💳 Payments | Razorpay / UPI / COD / Stripe (ready) |
| 📱 WhatsApp | Automatic order notifications |
| 📱 Responsive | Mobile, tablet & desktop |

---

## 🛠 Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** SQLite via sql.js (zero-config, no setup needed)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript

---

## ⚡ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/17arts.git
cd 17arts
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set environment variables
```bash
cp .env.example .env
# Open .env and change JWT_SECRET to something secure
```

### 4. Start the server
```bash
npm start
```

### 5. Open your browser
```
http://localhost:3000
```

---

## 🔑 Demo Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@17arts.in | admin123 |
| User | Register a new account | — |

---

## 📁 Project Structure

```
17arts/
├── server.js                   # Express server + all REST API routes
├── backend/
│   └── database.js             # SQLite setup, schema, seed data
├── frontend/
│   └── public/
│       ├── index.html          # 🏠 Home page
│       ├── collection.html     # 🎨 Art collection with filters
│       ├── product.html        # 🖼 Product detail page
│       ├── cart.html           # 🛒 Shopping cart
│       ├── checkout.html       # 💳 Checkout + payment
│       ├── signin.html         # 🔐 Sign in / Register
│       ├── profile.html        # 👤 User dashboard
│       ├── admin.html          # 🛡 Admin panel
│       ├── artists.html        # 👨‍🎨 Featured artists
│       ├── about.html          # ℹ️ About us
│       ├── contact.html        # 📧 Contact
│       ├── commission.html     # ✏️ Commission art
│       ├── css/
│       │   └── style.css       # Global styles
│       └── js/
│           └── app.js          # Shared JS (auth, API, cart, toast)
├── .env.example
├── .gitignore
├── Procfile
├── render.yaml
└── package.json
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Artworks
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/artworks | List all artworks |
| GET | /api/artworks/:id | Get artwork detail |
| POST | /api/artworks | Add artwork (admin) |
| PUT | /api/artworks/:id | Update artwork (admin) |
| DELETE | /api/artworks/:id | Delete artwork (admin) |

### Cart / Wishlist / Orders / Addresses
- Full CRUD for cart, wishlist, addresses
- Order placement and tracking
- Admin: view all orders, update status, view users

---

## 🚀 Deploy on Render (Free Hosting)

1. **Push to GitHub** (see instructions below)
2. Go to [render.com](https://render.com) → Sign up free
3. Click **New → Web Service**
4. Connect your GitHub repo `17arts`
5. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Add **Environment Variable:**
   - `JWT_SECRET` = `any_long_random_string_here`
7. Click **Deploy** 🎉

Your site will be live at: `https://17arts.onrender.com`

---

## 📤 Push to GitHub

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit — 17ARTS full-stack marketplace"

# 4. Create repo on GitHub: https://github.com/new
# Name it: 17arts

# 5. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/17arts.git
git branch -M main
git push -u origin main
```

---

## 📞 Contact

- 📞 +91 9014422656
- 📧 support@17arts.in  
- 📍 Hyderabad, Telangana, India

---

© 2026 17ARTS. All rights reserved.
