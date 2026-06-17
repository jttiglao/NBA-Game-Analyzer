from typing import Any, Dict, List, Optional
from .scoring.models import GameStats


def _to_float(x: Any) -> Optional[float]:
    if x is None:
        return None
    try:
        return float(x)
    except Exception:
        return None


def _to_num(x: Any) -> float:
    if x is None:
        return 0.0
    try:
        return float(x)
    except Exception:
        return 0.0


def normalize_gamelog_rows(rows: List[Dict[str, Any]]) -> List[GameStats]:
    """
    Convert nba_api PlayerGameLog DataFrame rows (dicts) into normalized GameStats.
    """
    out: List[GameStats] = []
    for r in rows:
        out.append(
            GameStats(
                game_id=str(r.get("Game_ID") or r.get("GAME_ID") or "") or None,
                date=str(r.get("GAME_DATE") or "") or None,
                matchup=str(r.get("MATCHUP") or "") or None,
                wl=str(r.get("WL") or "") or None,
                minutes=_to_float(r.get("MIN")),
                pts=_to_num(r.get("PTS")),
                reb=_to_num(r.get("REB")),
                ast=_to_num(r.get("AST")),
                stl=_to_num(r.get("STL")),
                blk=_to_num(r.get("BLK")),
                tov=_to_num(r.get("TOV")),
                fg3m=_to_num(r.get("FG3M")),
                fgm=_to_num(r.get("FGM")),
                fga=_to_num(r.get("FGA")),
                ftm=_to_num(r.get("FTM")),
                fta=_to_num(r.get("FTA")),
            )
        )
    return out
