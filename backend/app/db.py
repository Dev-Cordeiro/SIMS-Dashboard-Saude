import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL não definida no .env")
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    with conn.cursor() as cur:
        # Aumentado timeout para queries pesadas com índices
        cur.execute("SET statement_timeout = '600s'")
        # Otimizações adicionais
        cur.execute("SET work_mem = '256MB'")
        cur.execute("SET maintenance_work_mem = '512MB'")
    return conn
