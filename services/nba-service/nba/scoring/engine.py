from __future__ import annotations

from typing import List
from math import sqrt
from .models import GameStats, ScoringSettings, ScoredGame, FantasySummary


def _mean(xs: List[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def _stddev(xs: List[float]) -> float:
    # population stddev (stable for small samples)
    if not xs:
        return 0.0
    m = _mean(xs)
    var = _mean([(x - m) ** 2 for x in xs])
    return sqrt(var)


def _percentile(xs: List[float], p: float) -> float:
    """
    Simple percentile (p in [0,1]).
    Uses nearest-rank-ish linear interpolation.
    """
    if not xs:
        return 0.0
    s = sorted(xs)
    if len(s) == 1:
        return float(s[0])

    idx = (len(s) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(s) - 1)
    frac = idx - lo
    return float(s[lo] * (1 - frac) + s[hi] * frac)


def score_game(g: GameStats, scoring: ScoringSettings) -> float:
    return (
        g.pts * scoring.pts
        + g.reb * scoring.reb
        + g.ast * scoring.ast
        + g.stl * scoring.stl
        + g.blk * scoring.blk
        + g.tov * scoring.tov
        + g.fg3m * scoring.fg3m
        + g.fgm * scoring.fgm
        + g.fga * scoring.fga
        + g.ftm * scoring.ftm
        + g.fta * scoring.fta
    )


def score_games(games: List[GameStats], scoring: ScoringSettings) -> List[ScoredGame]:
    scored: List[ScoredGame] = []
    for g in games:
        fp = score_game(g, scoring)
        scored.append(ScoredGame(**g.model_dump(), fantasy_points=round(fp, 2)))
    return scored


def summarize(
    *,
    player_id: int,
    season: str,
    games: List[GameStats],
    scoring: ScoringSettings,
    windowsz: int = 30,
    last_n: int = 7,
) -> FantasySummary:
    # We assume games are ordered newest -> oldest (nba_api game log is usually newest first)
    window_games = games[:windowsz]
    scored_window = score_games(window_games, scoring)
    fps = [g.fantasy_points for g in scored_window]

    fppg = _mean(fps)
    vol = _stddev(fps)
    floor = _percentile(fps, 0.20)
    ceiling = _percentile(fps, 0.80)

    last_games = window_games[:last_n]
    scored_last = score_games(last_games, scoring)
    last_fps = [g.fantasy_points for g in scored_last]
    last_fppg = _mean(last_fps)

    # trend: compare last_n vs window average
    if fppg == 0:
        trend_pct = 0.0
    else:
        trend_pct = ((last_fppg - fppg) / fppg) * 100.0

    return FantasySummary(
        player_id=player_id,
        season=season,
        window=windowsz,
        scoring=scoring,
        games_count=len(window_games),
        fppg=round(fppg, 2),
        last_n=last_n,
        last_n_fppg=round(last_fppg, 2),
        trend_pct=round(trend_pct, 2),
        volatility_std=round(vol, 2),
        floor_p20=round(floor, 2),
        ceiling_p80=round(ceiling, 2),
        recent_games=scored_window[:min(len(scored_window), 10)],
    )
