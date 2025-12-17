# NBA Game Analyzer

A full-stack NBA analytics project.

## Architecture

- Frontend: Vite + React + Tailwind + shadcn/ui
- NBA data service: Python + FastAPI + nba_api
- Database: Supabase (PostgreSQL)

## Development

### 1) Run the NBA data service

```bash
cd services/nba-service
# activate venv
uvicorn main:app --reload --port 8000
```
