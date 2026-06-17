import time
from datetime import datetime
from nba_api.stats.static import players
from cache import supabase
from nba.scoring.engine import summarize, ScoringSettings
from nba.scoring.models import GameStats

# ── Config ────────────────────────────────────────────────────────────────────
SEASON = "2025-26"
DELAY = 1.5
WINDOWSZ = 82
LAST_N = 7

def fetch_player_gamelog(player_id: int, season: str):
    from nba_api.stats.endpoints import playergamelog
    time.sleep(DELAY)
    log = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = log.get_data_frames()[0]
    games = []
    for _, row in df.iterrows():
        try:
            games.append(GameStats(
                game_id=str(row["Game_ID"]),
                game_date=str(row["GAME_DATE"]),
                matchup=str(row["MATCHUP"]),
                pts=int(row["PTS"]),
                reb=int(row["REB"]),
                ast=int(row["AST"]),
                stl=int(row["STL"]),
                blk=int(row["BLK"]),
                tov=int(row["TOV"]),
                fgm=int(row["FGM"]),
                fga=int(row["FGA"]),
                fg3m=int(row["FG3M"]),
                ftm=int(row["FTM"]),
                fta=int(row["FTA"]),
                min=float(str(row["MIN"]).replace(":", ".")) if row["MIN"] else 0.0,
            ))
        except Exception:
            continue
    return games

def seed():
    print(f"Starting seed for season {SEASON}...")
    scoring = ScoringSettings()
    active = [p for p in players.get_players() if p.get("is_active")]
    total = len(active)
    print(f"Found {total} active players")

    # Clear existing cache
    supabase.table("leaderboard_cache").delete().neq("id", 0).execute()
    print("Cleared existing cache")

    seeded = 0
    failed = 0

    for i, p in enumerate(active):
        pid = int(p["id"])
        name = p.get("full_name", "")
        print(f"[{i+1}/{total}] {name}...")

        try:
            games = fetch_player_gamelog(pid, SEASON)
            if not games:
                print(f"  No games found, skipping")
                failed += 1
                continue

            summ = summarize(
                player_id=pid,
                season=SEASON,
                games=games,
                scoring=scoring,
                windowsz=WINDOWSZ,
                last_n=LAST_N,
            )

            wg = games[:WINDOWSZ]
            n = len(wg) or 1
            avg_pts = round(sum(g.pts for g in wg) / n, 2)
            avg_reb = round(sum(g.reb for g in wg) / n, 2)
            avg_ast = round(sum(g.ast for g in wg) / n, 2)

            row = {
                "player_id": pid,
                "player_name": name,
                "team": "",
                "season": SEASON,
                "games_count": summ.games_count,
                "fppg": summ.fppg,
                "last_n_fppg": summ.last_n_fppg,
                "trend_pct": summ.trend_pct,
                "volatility_std": summ.volatility_std,
                "floor_p20": summ.floor_p20,
                "ceiling_p80": summ.ceiling_p80,
                "avg_pts": avg_pts,
                "avg_reb": avg_reb,
                "avg_ast": avg_ast,
                "updated_at": datetime.utcnow().isoformat(),
            }

            supabase.table("leaderboard_cache").insert(row).execute()
            seeded += 1
            print(f"  ✓ {name} — {summ.fppg} FPPG")

        except Exception as e:
            print(f"  ✗ Failed: {e}")
            failed += 1
            continue

    print(f"\nSeed complete: {seeded} seeded, {failed} failed")

if __name__ == "__main__":
    seed()