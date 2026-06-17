from pydantic import BaseModel, Field
from typing import Optional, List


class ScoringSettings(BaseModel):
    pts: float = 1
    reb: float = 1
    ast: float = 2
    stl: float = 4
    blk: float = 4
    tov: float = -2.0
    fg3m: float = 1 
    fgm: float = 2
    fga: float = -1
    ftm: float = 1
    fta: float = -1


class GameStats(BaseModel):
    game_id: Optional[str] = None
    date: Optional[str] = None
    matchup: Optional[str] = None
    wl: Optional[str] = None
    minutes: Optional[float] = None

    pts: float = 0
    reb: float = 0
    ast: float = 0
    stl: float = 0
    blk: float = 0
    tov: float = 0
    fg3m: float = 0
    fgm: float = 0
    fga: float = 0
    ftm : float = 0
    fta : float = 0


class ScoredGame(GameStats):
    fantasy_points: float = 0


class FantasySummary(BaseModel):
    player_id: int
    season: str
    window: int
    scoring: ScoringSettings

    games_count: int
    fppg: float
    last_n: int
    last_n_fppg: float
    trend_pct: float

    volatility_std: float
    floor_p20: float
    ceiling_p80: float

    # include recent scored games so the UI can render a table
    recent_games: List[ScoredGame] = Field(default_factory=list)
