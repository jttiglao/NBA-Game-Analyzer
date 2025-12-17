from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nba_api.stats.static import players
from nba_api.stats.endpoints import playergamelog

app = FastAPI()

# Allow your Vite frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/players/search")
def search_players(q: str):
    all_players = players.get_players()
    results = [p for p in all_players if q.lower() in p["full_name"].lower()][:10]
    return results

@app.get("/players/{player_id}/games")
def player_games(player_id: str, season: str = "2023-24"):
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    return gamelog.get_dict()