import os
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CACHE_TTL_HOURS = 6  # refresh cache every 6 hours

def is_cache_fresh(updated_at: str) -> bool:
    last_updated = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    now = datetime.now(tz=last_updated.tzinfo)
    return now - last_updated < timedelta(hours=CACHE_TTL_HOURS)

def get_leaderboard_cache(season: str, limit: int) -> list | None:
    """Return cached leaderboard if fresh, otherwise None."""
    response = (
        supabase.table("leaderboard_cache")
        .select("*")
        .eq("season", season)
        .order("fppg", desc=True)
        .limit(limit)
        .execute()
    )

    if not response.data or len(response.data) < limit:
        return None

    if not is_cache_fresh(response.data[0]["updated_at"]):
        return None

    # Remap fields for frontend compatibility
    result = []
    for p in response.data:
        result.append({
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
        })
    return result

def set_leaderboard_cache(players: list, season: str) -> None:
    """Write leaderboard data to Supabase cache."""
    # Clear existing cache for this season
    supabase.table("leaderboard_cache").delete().eq("season", season).execute()

    # Insert new records
    rows = [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team": p.get("team"),
            "season": season,
            "games_count": p.get("games_count"),
            "fppg": p.get("fppg"),
            "last_n_fppg": p.get("last_n_fppg"),
            "trend_pct": p.get("trend_pct"),
            "volatility_std": p.get("volatility_std"),
            "floor_p20": p.get("floor_p20"),
            "ceiling_p80": p.get("ceiling_p80"),
            "updated_at": datetime.utcnow().isoformat(),
            "avg_pts": p.get("avg_pts"),
            "avg_reb": p.get("avg_reb"),
            "avg_ast": p.get("avg_ast"),
        }
        for p in players
    ]

    supabase.table("leaderboard_cache").insert(rows).execute()
    print(f"Leaderboard cache updated: {len(rows)} players")

def get_player_cache(player_id: int) -> dict | None:
    """Return cached player data if fresh, otherwise None."""
    response = (
        supabase.table("player_cache")
        .select("*")
        .eq("player_id", player_id)
        .execute()
    )

    if not response.data:
        return None

    record = response.data[0]
    if not is_cache_fresh(record["updated_at"]):
        return None

    return record["data"]

def set_player_cache(player_id: int, player_name: str, season: str, data: dict) -> None:
    """Write player data to Supabase cache."""
    supabase.table("player_cache").upsert({
        "player_id": player_id,
        "player_name": player_name,
        "season": season,
        "data": data,
        "updated_at": datetime.utcnow().isoformat(),
    }).execute()