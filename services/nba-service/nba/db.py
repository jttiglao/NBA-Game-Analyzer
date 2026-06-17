import os
from psycopg import connect
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL")
if not DB_URL:
    raise RuntimeError("Missing SUPABASE_DB_URL in environment.")

def get_conn():
    return connect(DB_URL, row_factory=dict_row)