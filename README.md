# ReWear

## Project Structure

```
ReWear/
├── src/                              # Frontend source code (React + TypeScript)
│   ├── api/                          # API client modules
│   │   ├── client.ts                 # Base fetch helper & config
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── items.ts                  # Wardrobe item endpoints
│   │   ├── outfits.ts                # Outfit logging endpoints
│   │   └── detection.ts              # Clothing detection endpoint
│   ├── components/                   # Reusable UI components
│   │   ├── CreateItemModal.tsx       # New wardrobe item form
│   │   ├── ItemCard.tsx              # Item thumbnail card
│   │   ├── ItemDetailModal.tsx       # Item info overlay
│   │   ├── Navbar.tsx                # Top navigation bar
│   │   ├── OutfitDetailModal.tsx     # Outfit info overlay
│   │   ├── PostponeModal.tsx         # Forgotten-item postpone dialog
│   │   └── WardrobePickerModal.tsx   # Manual item picker for outfits
│   ├── contexts/                     # React context providers
│   │   ├── AuthContext.tsx           # Authentication state
│   │   └── WardrobeContext.tsx       # Wardrobe & outfit state
│   ├── pages/                        # Page-level views
│   │   ├── CameraView.tsx            # Live camera & photo upload detection
│   │   ├── InsightsView.tsx          # Wear analytics & charts
│   │   ├── InstructionsView.tsx      # How-to guide
│   │   ├── LoginView.tsx
│   │   ├── RegisterView.tsx
│   │   └── WardrobeView.tsx          # Wardrobe management
│   ├── App.tsx                       # Root component & routing
│   ├── index.tsx                     # React entry point
│   ├── index.css
│   └── types.ts                      # Shared TypeScript types
├── rewear_app/                       # Backend (Python / Flask)
│   ├── app.py                        # App factory, config & blueprint registration
│   ├── models.py                     # SQLAlchemy database models
│   ├── helpers.py                    # Shared utilities (auth, serializers)
│   ├── detector.py                   # YOLO clothing detection module
│   └── routes/                       # Flask blueprints
│       ├── auth.py                   # /auth/* endpoints
│       ├── items.py                  # /items/* endpoints
│       ├── outfits.py                # /outfits/* & /uploads/* endpoints
│       └── detection.py              # /detect endpoint
├── docs/                             # Course documentation
│   ├── Computer Vision Research/
│   ├── Feedback/
│   ├── Initial Design Ideas/
│   ├── User Interviews/
│   └── schema.png                    # Database schema diagram
├── public/                           # Static assets served by Vite
├── index.html                        # Vite entry HTML
├── vite.config.ts                    # Vite config (dev server, proxy, aliases)
├── tsconfig.json                     # TypeScript config
├── package.json                      # Frontend dependencies & scripts
└── requirements.txt                  # Python dependencies
```

## Running the Application

### Prerequisites

- **Node.js** (v18+) — for the Vite frontend
- **Python 3.10+** — for the Flask backend
- A Python virtual environment (recommended)

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Set up the Python environment

```bash
# Create and activate a virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt
```

### 3. Configure environment variables

The backend reads configuration from environment variables. Create a `.env` file in the project root or export the variables in your shell before starting
the server.

### 4. Start the Flask backend

```bash
cd rewear_app
python app.py
# Backend runs at http://localhost:5001
```

### 5. Start the Vite dev server

Open a second terminal:

```bash
npm run dev
# Frontend runs at http://localhost:3000
```

The Vite dev server proxies `/api/*` and `/uploads/*` requests to
`http://localhost:5001`, so no CORS configuration is needed during development.

---

## Testing

Unit tests were added for the backend Flask application and cover:

- Authentication endpoints and session handling
- Items CRUD operations and validation
- Outfits creation and item assignment logic
- SQLAlchemy models and database constraints
- Serialization helpers for API responses

Detailed instructions and the full test suite summary are available in [TESTING.md](TESTING.md) and [tests/README.md](tests/README.md).

---

# Introduction

Fashion brands now produce nearly twice as much clothing as they did before 2000. The industry generates over 92 million tonnes of waste annually (Niinimäki et al., 2020). However, studies reveal that nearly 25% of clothing in closets is never used (de Wagenaar et al., 2022). Environmental harm and financial waste result from underutilization. **Rewear** helps users make the most of their current wardrobes by turning wardrobe tracking into a quick daily routine that shows wear patterns and recommends items they may have forgotten.

# Problem

Underutilization of clothing is a critical problem at the intersection of consumer behavior, financial waste, and environmental sustainability. Use of a single clothing garment has declined by almost 40% in the last 15 years (Ellen MacArthur Foundation, 2019). Even when the current closet meets the same needs, a main psychological driver of continued purchasing is the perceived lack of outfit options (Laitala & Klepp, 2020). This creates a reinforcing cycle of overconsumption.

The consequences extend across multiple dimensions. According to Niinimäki et al. (2020), impacts include over 79 trillion litres of water wasted by clothes manufacturing brands. People continue this cycle by buying unnecessary replacements and duplicates when they do not use their existing wardrobes. According to research on clothing use behavior, reducing the purchase of new clothing has the biggest potential to reduce global carbon emissions associated with fashion consumption (Koch et al., 2025).

# Proposed Solution

Popular wardrobe-tracking apps like Stylebook (100k+ downloads) demonstrate people's willingness to engage with outfit tracking, but they focus primarily on style planning rather than optimization. Rewear takes a different approach: by making daily outfit logging effortless (under 10 seconds) and immediately providing insights about wear patterns, the web app gives the closet a data-driven use.

Unlike existing digital closet apps that require taking a picture of every item individually—a barrier that prevents most users from completing setup—Rewear uses **progressive cataloging**, where users simply snap quick photos each morning of what they're wearing.

# Description

Rewear is a web application designed to help users understand how they actually use their wardrobe by tracking daily outfit wear. Rather than asking users to fully log their closets, the system focuses on low-effort daily logging and builds insights gradually over time.

The core user flow centers on a quick daily check-in:

1. Open the app in a browser
2. Upload a photo of the day's outfit
3. Confirm AI-proposed item tagging (with manual correction if needed)

Each action takes about 10 seconds. As data is gathered, the app reveals insights progressively:

- **After one week:** Users can see which items they've worn at least once
- **After two weeks:** The app highlights which items appear most frequently in outfits
- **After one month:** Users receive a high-level wardrobe utilization score showing how much of their closet is actually being used

### MVP Features (15-week scope)

- Fast, mobile-optimized outfit photo uploads
- AI-assisted item tagging with user confirmation
- Usage dashboard showing wear frequency per item and total unique items worn
- Simple outfit history timeline
- Weekly reminders highlighting "forgotten favs" (items not worn in 30+ days)

An optional one-time closet log can be used to set a baseline, but it is not required for the web app to function.

# Target Audience

Target users are students and young adults (Gen Z, ages 18–34) interested in fashion, self-tracking, or sustainability. Many already take outfit photos, own moderate to large wardrobes, and experience decision fatigue or "closet blindness." ReWear helps them understand and use what they already own.

**Primary segments include:**

- University students
- Young professionals managing growing closets on tight budgets
- Sustainability-minded users
- Content creators who already document outfits

**Secondary users include:**

- People experimenting with capsule wardrobes
- Individuals casually tracking clothing habits

# Feasibility

The project is feasible for a small team working part-time. Rewear relies on straightforward analytics (counting item occurrences in outfit logs), which makes the system easy to implement and debug.

Development can proceed within **15 weeks**:

- **Early weeks:** Setting up a simple, mobile-responsive frontend and core data structures
- **Middle phase:** Outfit logging, item tagging, and usage aggregation
- **Later weeks:** Visual analytics, basic recommendations, and light AI assistance for tagging
- **Final phase:** Testing

**Technical stack:**

- Python/Flask backend with SQLAlchemy (SQLite)
- YOLO-based computer vision for clothing detection
- React + TypeScript frontend with Vite
