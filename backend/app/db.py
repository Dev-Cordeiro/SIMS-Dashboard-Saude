import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL não definida. Verifique as variáveis de ambiente no Railway.")
    try:
        import urllib.parse
        parsed_url = urllib.parse.urlparse(DATABASE_URL)
        
        if 'supabase.co' in parsed_url.hostname or 'supabase' in DATABASE_URL.lower():
            conn_params = {
                'host': parsed_url.hostname,
                'port': parsed_url.port or 5432,
                'database': parsed_url.path.lstrip('/').split('?')[0],
                'user': parsed_url.username,
                'password': parsed_url.password,
                'cursor_factory': RealDictCursor,
                'connect_timeout': 30,
            }
            
            query_params = urllib.parse.parse_qs(parsed_url.query)
            if 'sslmode' in query_params:
                conn_params['sslmode'] = query_params['sslmode'][0]
            else:
                conn_params['sslmode'] = 'require'
            
            conn = psycopg2.connect(**conn_params)
        else:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor, connect_timeout=30)
        
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = '600s'")
            cur.execute("SET work_mem = '256MB'")
            cur.execute("SET maintenance_work_mem = '512MB'")
        return conn
    except psycopg2.OperationalError as e:
        error_msg = str(e)
        if 'network is unreachable' in error_msg.lower() or 'could not connect' in error_msg.lower() or 'network is unreachable' in error_msg:
            raise RuntimeError(
                f"Erro ao conectar ao banco Supabase: {error_msg}. "
                f"SOLUÇÃO: No Supabase Dashboard, vá em Settings → Database → Connection Pooling e use a connection string do 'Transaction' mode (porta 6543) ou 'Session' mode (porta 5432). "
                f"Alternativamente, verifique se o banco está acessível publicamente."
            )
        raise RuntimeError(f"Erro ao conectar ao banco de dados: {error_msg}")
    except Exception as e:
        raise RuntimeError(f"Erro inesperado ao conectar ao banco: {str(e)}")
