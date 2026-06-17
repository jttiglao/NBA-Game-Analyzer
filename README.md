# 🏀 NBA Game Analyzer

A full-stack NBA analytics platform for deep fantasy basketball insights. Search any active player, explore their full season game log, visualize their shot chart and performance trends, and compare players head to head.

---

## Features

- **Player Search** — Search any active NBA player by name and view their full season breakdown
- **Fantasy Summary** — Season FPPG, Last N FPPG, trend, volatility, floor, and ceiling
- **Performance Chart** — Fantasy points per game plotted across the full season with win/loss indicators
- **Shot Chart** — Full season shot locations on an SVG court, filterable by 2PT and 3PT
- **Sortable Game Log** — Full game-by-game stats sortable by any column
- **Player Comparison** — Head to head stat comparison with category-by-category winner
- **Leaderboard** — All 500+ active NBA players ranked by FPPG, PTS, REB, AST, floor, ceiling, and volatility
- **Supabase Caching** — Leaderboard data cached in PostgreSQL for instant load times with daily refresh

---

## Architecture

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Python + FastAPI + nba_api
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts (performance), SVG (shot chart)

---

## Project Structure

NBA-Game-Analyzer/

├── src/

│ ├── pages/

│ │ ├── Home.tsx # Landing page

│ │ ├── PlayerSearch.tsx # Player search

│ │ ├── PlayerPage.tsx # Player detail, charts, comparison

│ │ └── Leaderboard.tsx # Full player leaderboard

│ └── App.tsx

├── services/

│ └── nba-service/

│ ├── main.py # FastAPI endpoints

│ ├── cache.py # Supabase caching logic

│ ├── seed.py # Leaderboard seed script

│ └── nba/

│ └── scoring/ # Fantasy scoring engine

└── README.md

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/jttiglao/NBA-Game-Analyzer.git
cd NBA-Game-Analyzer
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up the Python backend

```bash
cd services/nba-service
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install fastapi uvicorn nba_api supabase python-dotenv
```

### 4. Configure environment variables

Create a `.env` file in `services/nba-service/`:
SUPABASE_URL=your-supabase-url

SUPABASE_KEY=your-supabase-anon-key

### 5. Seed the leaderboard cache

```bash
python seed.py
```

This fetches all active NBA players from the NBA API and stores them in Supabase. Takes ~10-15 minutes on first run.

### 6. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

### 7. Run the frontend

```bash
cd ../..
npm run dev
```

---

## API Endpoints

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/players/search?q={name}`      | Search players by name  |
| GET    | `/players/{id}/info`            | Get player info         |
| GET    | `/players/{id}/gamelog`         | Full season game log    |
| GET    | `/players/{id}/fantasy-summary` | Fantasy stats summary   |
| GET    | `/players/{id}/shotchart`       | Shot location data      |
| GET    | `/players/leaderboard`          | Full player leaderboard |

---

## Author

**Andre Tiglao**
Computer Science, Pennsylvania State University '24
[GitHub](https://github.com/jttiglao)
