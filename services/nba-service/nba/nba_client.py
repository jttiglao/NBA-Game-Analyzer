from typing import Any, Dict, List, Tuple
from time import time

from nba_api.stats.endpoints import playergamelog

from .normalize import normalize_gamelog_rows
from .scoring.models import GameStats

# Simple in-memory cache: (player_id, season) -> (timestamp, games)
_CACHE: Dict[Tuple[int, str], Tuple[float, List[GameStats]]] = {}
CACHE_TTL_SECONDS = 60 * 10  # 10 minutes


def fetch_player_gamelog(player_id: int, season: str) -> List[GameStats]:
    gl = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = gl.get_data_frames()[0]
    rows: List[Dict[str, Any]] = df.to_dict(orient="records")
    return normalize_gamelog_rows(rows)


def fetch_player_gamelog_cached(player_id: int, season: str) -> List[GameStats]:
    key = (player_id, season)
    now = time()

    if key in _CACHE:
        ts, games = _CACHE[key]
        if now - ts < CACHE_TTL_SECONDS:
            return games

    games = fetch_player_gamelog(player_id, season)
    _CACHE[key] = (now, games)
    return games
