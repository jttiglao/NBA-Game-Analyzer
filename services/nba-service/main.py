from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nba_api.stats.static import players

from concurrent.futures import ThreadPoolExecutor, as_completed

from nba.nba_client import fetch_player_gamelog, fetch_player_gamelog_cached
from nba.scoring.engine import summarize, score_games
from nba.scoring.models import ScoringSettings, FantasySummary

from nba.db import get_conn



app = FastAPI(title="NBA Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db/health")
def db_health():
    with get_conn() as conn:
        conn.execute("SELECT 1")
    return {"status": "ok"}

@app.get("/players/search")
def search_players(q: str, limit: int = 25):
    query = q.strip().lower()
    if not query:
        return {"data": []}

    results = players.find_players_by_full_name(q)

    if not results:
        all_players = players.get_players()
        results = [
            p for p in all_players
            if query in (p.get("full_name", "").lower())
            or query in (p.get("first_name", "").lower())
            or query in (p.get("last_name", "").lower())
        ]

    results.sort(key=lambda p: (not p.get("is_active", False), p.get("full_name", "")))
    return {"data": results[:limit]}

@app.get("/players/{player_id}/shotchart")
def shotchart(player_id: int, season: str = "2024-25"):
    from nba_api.stats.endpoints import shotchartdetail
    import time
    time.sleep(1)
    shots = shotchartdetail.ShotChartDetail(
        team_id=0,
        player_id=player_id,
        season_nullable=season,
        context_measure_simple="FGA"
    )
    df = shots.get_data_frames()[0]
    return {
        "data": df[["LOC_X", "LOC_Y", "SHOT_MADE_FLAG", "SHOT_TYPE", "ACTION_TYPE", "SHOT_ZONE_BASIC"]].to_dict(orient="records")
    }

@app.get("/players/{player_id}/gamelog")
def get_player_gamelog(player_id: int, season: str = "2025-26"):
    games = fetch_player_gamelog(player_id, season)

    scoring = ScoringSettings()  # default league scoring
    scored = score_games(games, scoring)  # adds fantasy_points per game

    return {
        "season": season,
        "scoring": scoring.model_dump(),
        "data": [g.model_dump() for g in scored],
    }

    
@app.get("/players/{player_id}/info")
def player_info(player_id: int):
    all_players = players.get_players()
    match = next((p for p in all_players if int(p["id"]) == player_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "id": player_id,
        "full_name": match.get("full_name"),
        "first_name": match.get("first_name"),
        "last_name": match.get("last_name"),
        "is_active": match.get("is_active"),
    }


@app.get("/players/{player_id}/fantasy-summary", response_model=FantasySummary)
def get_fantasy_summary(
    player_id: int,
    season: str = "2025-26",
    windowsz: int = 30,
    last_n: int = 7,
):
    games = fetch_player_gamelog(player_id, season)
    scoring = ScoringSettings()  # default scoring
    return summarize(
        player_id=player_id,
        season=season,
        games=games,
        scoring=scoring,
        windowsz=windowsz,
        last_n=last_n,
    )


@app.post("/players/{player_id}/fantasy-summary", response_model=FantasySummary)
def post_fantasy_summary(
    player_id: int,
    scoring: ScoringSettings,
    season: str = "2025-26",
    windowsz: int = 30,
    last_n: int = 7,
):
    games = fetch_player_gamelog(player_id, season)
    return summarize(
        player_id=player_id,
        season=season,
        games=games,
        scoring=scoring,
        windowsz=windowsz,
        last_n=last_n,
    )

def compute_averages(games, windowsz: int):
    windowsz_games = games[:windowsz]
    n = len(windowsz_games)
    if n == 0:
        return {
            "avg_pts": 0, "avg_reb": 0, "avg_ast": 0, "avg_stl": 0, "avg_blk": 0,
            "avg_tov": 0, "avg_fg3m": 0, "avg_ftm": 0, "avg_fta": 0
        }

    def avg(field: str) -> float:
        return round(sum(getattr(g, field, 0) for g in windowsz_games) / n, 2)

    return {
        "avg_pts": avg("pts"),
        "avg_reb": avg("reb"),
        "avg_ast": avg("ast"),
        "avg_stl": avg("stl"),
        "avg_blk": avg("blk"),
        "avg_tov": avg("tov"),
        "avg_fg3m": avg("fg3m"),
        "avg_ftm": avg("ftm"),
        "avg_fta": avg("fta"),
    }

@app.get("/players/search-enriched")
def search_players_enriched(
    q: str,
    limit: int = 15,
    season: str = "2025-26",
    windowsz: int = 30,
    last_n: int = 7,
):
    """
    Search players, then enrich each result with:
    - last 30 averages (traditional stats)
    - last 30 FPPG
    - last 7 FPPG
    - trend %
    """
    season = season
    query = q.strip().lower()
    if not query:
        return {"season": season, "data": []}

    # Reuse your existing search logic
    results = players.find_players_by_full_name(q)
    if not results:
        all_players = players.get_players()
        results = [
            p for p in all_players
            if query in (p.get("full_name", "").lower())
            or query in (p.get("first_name", "").lower())
            or query in (p.get("last_name", "").lower())
        ]

    results.sort(key=lambda p: (not p.get("is_active", False), p.get("full_name", "")))
    results = results[:limit]

    scoring = ScoringSettings()

    def enrich(p):
        pid = int(p["id"])
        games = fetch_player_gamelog_cached(pid, season)

        # Summary metrics
        summ = summarize(
            player_id=pid,
            season=season,
            games=games,
            scoring=scoring,
            windowsz=windowsz,
            last_n=last_n,
        )

        # Traditional averages (same windowsz)
        avgs = compute_averages(games, windowsz)

        return {
            "id": pid,
            "full_name": p.get("full_name"),
            "is_active": p.get("is_active", False),

            # fantasy summary
            "fppg_30": summ.fppg,
            "fppg_7": summ.last_n_fppg,
            "trend_pct": summ.trend_pct,
            "volatility": summ.volatility_std,
            "floor": summ.floor_p20,
            "ceiling": summ.ceiling_p80,

            # stat averages (windowsz)
            **avgs,
        }

    enriched = []

        
    # Parallelize a bit (don’t go crazy or you’ll rate-limit)
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = [ex.submit(enrich, p) for p in results]
        for f in as_completed(futures):
            try:
                enriched.append(f.result())
            except Exception as e:
                # If one player fails, don't kill the whole request
                continue

    # Keep output stable: sort by name
    enriched.sort(key=lambda x: x.get("full_name") or "")
    return {"season": season, "data": enriched}

@app.get("/players/leaderboard")
def leaderboard(
    limit: int = 25,
    season: str = "2025-26",
    windowsz: int = 82,
    last_n: int = 7,
    sort_by: str = "fppg"
):
    from cache import supabase

    valid_sorts = {
        "fppg": "fppg",
        "fppg_7": "last_n_fppg",
        "trend": "trend_pct",
        "pts": "avg_pts",
        "reb": "avg_reb",
        "ast": "avg_ast",
        "floor": "floor_p20",
        "ceiling": "ceiling_p80",
    }
    sort_col = valid_sorts.get(sort_by, "fppg")

    response = (
        supabase.table("leaderboard_cache")
        .select("*")
        .eq("season", season)
        .order(sort_col, desc=True)
        .limit(limit)
        .execute()
    )

    data = []
    for p in response.data:
        wg_limit = min(windowsz, p.get("games_count") or 82)
        data.append({
            "id": p["player_id"],
            "full_name": p["player_name"],
            "team": p.get("team"),
            "is_active": True,
            "fppg": p.get("fppg"),
            "fppg_7": p.get("last_n_fppg"),
            "trend_pct": p.get("trend_pct"),
            "volatility_std": p.get("volatility_std"),
            "floor_p20": p.get("floor_p20"),
            "ceiling_p80": p.get("ceiling_p80"),
            "avg_pts": p.get("avg_pts"),
            "avg_reb": p.get("avg_reb"),
            "avg_ast": p.get("avg_ast"),
            "games_count": wg_limit,
        })

    return {
        "season": season,
        "windowsz": windowsz,
        "last_n": last_n,
        "sort_by": sort_by,
        "data": data,
        "cached": True
    }