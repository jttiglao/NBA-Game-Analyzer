from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nba_api.stats.static import players
from nba_api.stats.endpoints import playergamelog

app = FastAPI(title="NBA Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/players/search")
def search_players(q: str, limit: int = 25):
    query = q.strip().lower()
    if not query:
        return {"data": []}

    # 1) Try nba_api helper (works best for full names)
    results = players.find_players_by_full_name(q)

    # 2) Fallback: substring search on first/last/full name
    if not results:
        all_players = players.get_players()
        results = [
            p for p in all_players
            if query in (p.get("full_name", "").lower())
            or query in (p.get("first_name", "").lower())
            or query in (p.get("last_name", "").lower())
        ]

    # Optional: sort active players first
    results.sort(key=lambda p: (not p.get("is_active", False), p.get("full_name", "")))

    return {"data": results[:limit]}


@app.get("/players/{player_id}/gamelog")
def player_game_log(player_id: int, season: str = "2023-24"):
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = gamelog.get_data_frames()[0]
    return {"data": df.to_dict(orient="records")}