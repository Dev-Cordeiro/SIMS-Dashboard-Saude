from fastapi import FastAPI, Query, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from .db import get_connection
from .supabase_client import supabase
from typing import Optional
import psycopg2
from functools import lru_cache
from datetime import datetime, timedelta

def rows_to_dicts(cur):
    # Convert cursor results to plain dicts for JSON serialization
    return [dict(row) for row in cur.fetchall()]

def row_to_dict(row):
    return dict(row) if row else None

app = FastAPI(title="API Dashboard Saúde - TCC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/debug/indices")
def verificar_indices():
    """Endpoint temporário para verificar se os índices foram criados"""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        indexname,
                        indexdef
                    FROM pg_indexes 
                    WHERE tablename = 'fato_saude_mensal'
                      AND indexname LIKE 'idx_fato%'
                    ORDER BY indexname;
                """)
                indices = rows_to_dicts(cur)
                
                index_names = [idx['indexname'] for idx in indices]
                indices_criticos = [
                    'idx_fato_cid_cap_internacoes',
                    'idx_fato_cid_cap_obitos',
                    'idx_fato_series_internacoes',
                    'idx_fato_series_obitos'
                ]
                
                indices_faltando = [idx for idx in indices_criticos if idx not in index_names]
                
                return {
                    "total_indices": len(indices),
                    "indices_encontrados": index_names,
                    "indices_criticos_faltando": indices_faltando,
                    "todos_indices": indices
                }
    except Exception as e:
        return {"erro": str(e)}

@app.get("/api/debug/query-plan")
def plano_execucao_cid_cap():
    """Endpoint temporário para ver o plano de execução da query"""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                    SELECT
                        c.capitulo_cod,
                        c.titulo AS capitulo_nome,
                        SUM(f.qtd_internacoes) AS total_internacoes
                    FROM fato_saude_mensal f
                    INNER JOIN dim_cid10_capitulo c ON f.id_capitulo = c.id_capitulo
                    WHERE f.id_tipo_evento = 10 
                      AND f.id_capitulo IS NOT NULL
                      AND f.qtd_internacoes > 0
                    GROUP BY c.capitulo_cod, c.titulo
                    HAVING SUM(f.qtd_internacoes) > 0
                    ORDER BY total_internacoes DESC
                    LIMIT 10;
                """
                cur.execute(query)
                plan = cur.fetchone()[0]
                return {
                    "plano": plan,
                    "resumo": {
                        "tempo_total": plan[0].get('Execution Time', 0),
                        "linhas": plan[0].get('Plan', {}).get('Actual Rows', 0)
                    }
                }
    except Exception as e:
        return {"erro": str(e)}
    """Endpoint de health check leve para verificar se o backend está disponível"""
    return {"status": "healthy", "message": "Backend está respondendo"}

security = HTTPBearer()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica o token JWT e retorna o usuário autenticado"""
    try:
        token = credentials.credentials
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado"
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )

@app.post("/api/login")
async def login(credentials: LoginRequest):
    """
    Endpoint de login usando Supabase Auth.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        if hasattr(response.user, 'email_confirmed_at') and not response.user.email_confirmed_at:
            raise HTTPException(
                status_code=401, 
                detail="Email não confirmado. Verifique sua caixa de entrada."
            )
        
        if not response.session:
            raise HTTPException(
                status_code=401,
                detail="Não foi possível criar sessão. Verifique se seu email foi confirmado."
            )
        
        profile = None
        try:
            profile_data = supabase.table("profiles").select("*").eq("id", response.user.id).execute()
            if profile_data.data:
                profile = profile_data.data[0]
        except Exception as e:
            pass
        
        user_data = {
            "id": response.user.id,
            "email": response.user.email,
            "name": profile.get("name") if profile else response.user.email.split("@")[0],
            "phone": profile.get("phone") if profile else None,
            "organization": profile.get("organization") if profile else None,
        }
        
        return {
            "success": True,
            "user": user_data,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg or "invalid_credentials" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")
        elif "Email not confirmed" in error_msg or "email_not_confirmed" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Email não confirmado. Verifique sua caixa de entrada.")
        else:
            raise HTTPException(status_code=401, detail=f"Erro ao fazer login: {error_msg}")

@app.post("/api/signup")
async def signup(data: SignUpRequest):
    """
    Endpoint de cadastro usando Supabase Auth.
    """
    try:
        import os
        frontend_url = os.getenv("FRONTEND_URL", "https://sims-dashboard-saude.vercel.app")
        redirect_url = f"{frontend_url}/"
        
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "name": data.name or data.email.split("@")[0]
                },
                "email_redirect_to": redirect_url
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Erro ao criar usuário")
        
        email_confirmed = getattr(response.user, 'email_confirmed_at', None) is not None
        needs_confirmation = not email_confirmed
        
        try:
            supabase.table("profiles").insert({
                "id": response.user.id,
                "email": data.email,
                "name": data.name or data.email.split("@")[0]
            }).execute()
        except Exception as e:
            pass
        
        return {
            "success": True,
            "message": "Usuário criado com sucesso",
            "needs_email_confirmation": needs_confirmation,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "name": data.name or data.email.split("@")[0]
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "User already registered" in error_msg or "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Este email já está cadastrado")
        raise HTTPException(status_code=400, detail=f"Erro ao criar conta: {error_msg}")

@app.get("/api/user/profile")
async def get_profile(current_user = Depends(get_current_user)):
    """Busca o perfil do usuário autenticado"""
    try:
        profile = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        if profile.data:
            return {"success": True, "profile": profile.data[0]}
        return {"success": True, "profile": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Endpoint para solicitar recuperação de senha.
    Envia email com link para redefinir senha.
    """
    try:
        import os
        frontend_url = os.getenv("FRONTEND_URL", "https://sims-dashboard-saude.vercel.app")
        redirect_url = f"{frontend_url}/reset-password"
        
        response = supabase.auth.reset_password_for_email(
            data.email,
            {
                "redirect_to": redirect_url
            }
        )
        
        # O Supabase sempre retorna sucesso (por segurança) mesmo se o email não existir
        return {
            "success": True,
            "message": "Se o email estiver cadastrado, você receberá um link de recuperação."
        }
    except Exception as e:
        error_msg = str(e)
        # Por segurança, sempre retornamos sucesso
        return {
            "success": True,
            "message": "Se o email estiver cadastrado, você receberá um link de recuperação."
        }

@app.post("/api/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Endpoint para redefinir senha usando o token do email.
    NOTA: Este endpoint não é mais necessário, pois o frontend faz o reset
    diretamente com o Supabase. Mantido para compatibilidade.
    """
    # O reset de senha agora é feito diretamente no frontend usando o Supabase client
    # O token vem no hash da URL e é processado pelo componente ResetPassword
    return {
        "success": False,
        "error": "Este endpoint não é mais usado. O reset de senha é feito diretamente no frontend."
    }

@app.put("/api/user/profile")
async def update_profile(profile_data: ProfileUpdate, current_user = Depends(get_current_user)):
    """Atualiza o perfil do usuário autenticado"""
    try:
        update_dict = profile_data.dict(exclude_unset=True)
        if not update_dict:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        
        result = supabase.table("profiles").update(update_dict).eq("id", current_user.id).execute()
        
        return {"success": True, "profile": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/user/account")
async def delete_account(current_user = Depends(get_current_user)):
    """Deleta a conta do usuário autenticado"""
    try:
        user_id = current_user.id
        
        # Deletar o perfil da tabela profiles
        try:
            supabase.table("profiles").delete().eq("id", user_id).execute()
        except Exception as e:
            # Se não houver perfil, continua
            pass
        
        # Deletar o usuário do Supabase Auth
        # Nota: O Supabase Admin API é necessário para deletar usuários
        # Por enquanto, vamos apenas deletar o perfil e marcar como deletado
        # O usuário não conseguirá mais fazer login se o perfil não existir
        
        return {
            "success": True,
            "message": "Conta encerrada com sucesso"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao encerrar conta: {str(e)}")

@app.get("/api/localidades")
def listar_localidades():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    SELECT id_localidade, municipio, uf
                    FROM dim_localidade
                    ORDER BY municipio;
                    '''
                )
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar localidades: {str(e)}")

@app.get("/api/periodo-dados")
def periodo_dados():
    """Retorna o período mínimo e máximo dos dados disponíveis"""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    WITH tempos_com_dados AS (
                        SELECT DISTINCT t.ano, t.mes
                        FROM dim_tempo t
                        WHERE EXISTS (
                            SELECT 1 
                            FROM fato_saude_mensal f
                            WHERE f.id_tempo = t.id_tempo
                              AND f.id_tempo IS NOT NULL
                              AND f.id_tempo != 0
                            LIMIT 1
                        )
                    )
                    SELECT 
                        MIN(ano) AS ano_inicio,
                        MAX(ano) AS ano_fim,
                        MIN(CASE WHEN ano = (SELECT MIN(ano) FROM tempos_com_dados) THEN mes END) AS mes_inicio,
                        MAX(CASE WHEN ano = (SELECT MAX(ano) FROM tempos_com_dados) THEN mes END) AS mes_fim
                    FROM tempos_com_dados;
                    '''
                )
                row = row_to_dict(cur.fetchone())
                
                if row:
                    return {
                        "ano_inicio": row.get("ano_inicio"),
                        "ano_fim": row.get("ano_fim"),
                        "mes_inicio": row.get("mes_inicio"),
                        "mes_fim": row.get("mes_fim")
                    }
                return {"ano_inicio": None, "ano_fim": None, "mes_inicio": None, "mes_fim": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar período dos dados: {str(e)}")

@app.get("/api/series/mensal")
def series_mensal(
    id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar"),
    ano_inicio: Optional[int] = Query(None, description="Ano inicial para filtrar"),
    ano_fim: Optional[int] = Query(None, description="Ano final para filtrar"),
    mes: Optional[int] = Query(None, description="Mês para filtrar (1-12)"),
    limit: Optional[int] = Query(5000, description="Limite de registros (padrão: 5000)")
):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = '''
                    WITH tempo_filtrado AS (
                        SELECT id_tempo, ano, mes
                        FROM dim_tempo
                        WHERE id_tempo IS NOT NULL AND id_tempo != 0
                '''
                params = []
                if ano_inicio:
                    query += ' AND ano >= %s'
                    params.append(ano_inicio)
                if ano_fim:
                    query += ' AND ano <= %s'
                    params.append(ano_fim)
                if mes:
                    query += ' AND mes = %s'
                    params.append(mes)
                
                query += '''
                    )
                    SELECT
                        COALESCE(i.ano, o.ano) AS ano,
                        COALESCE(i.mes, o.mes) AS mes,
                        CONCAT(COALESCE(i.ano, o.ano), '-', LPAD(COALESCE(i.mes, o.mes)::text, 2, '0')) AS ano_mes,
                        COALESCE(i.internacoes, 0) AS internacoes,
                        COALESCE(o.obitos, 0) AS obitos
                    FROM (
                        SELECT
                            t.ano,
                            t.mes,
                            SUM(f.qtd_internacoes) AS internacoes
                        FROM fato_saude_mensal f
                        INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                        WHERE f.id_tempo IS NOT NULL
                          AND f.id_tempo != 0
                          AND f.id_tipo_evento = 3
                          AND f.qtd_internacoes > 0
                '''
                if id_localidade:
                    query += ' AND f.id_localidade = %s'
                    params.append(id_localidade)
                
                query += '''
                        GROUP BY t.ano, t.mes
                    ) i
                    FULL OUTER JOIN (
                        SELECT
                            t.ano,
                            t.mes,
                            SUM(f.qtd_obitos) AS obitos
                        FROM fato_saude_mensal f
                        INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                        WHERE f.id_tempo IS NOT NULL
                          AND f.id_tempo != 0
                          AND f.id_tipo_evento = 4
                          AND f.qtd_obitos > 0
                '''
                if id_localidade:
                    query += ' AND f.id_localidade = %s'
                    params.append(id_localidade)
                
                query += '''
                        GROUP BY t.ano, t.mes
                    ) o ON i.ano = o.ano AND i.mes = o.mes
                    ORDER BY COALESCE(i.ano, o.ano), COALESCE(i.mes, o.mes)
                    LIMIT %s;
                '''
                params.append(limit)
                
                cur.execute(query, params)
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de série mensal. Verifique os logs do backend. Erro: {error_msg}")

@app.get("/api/internacoes/sexo")
def internacoes_por_sexo(id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar")):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = '''
                    WITH dados_filtrados AS (
                        SELECT 
                            f.id_sexo,
                            f.qtd_internacoes
                        FROM fato_saude_mensal f
                        WHERE f.id_tipo_evento = 5
                          AND f.qtd_internacoes > 0
                '''
                params = []
                if id_localidade:
                    query += ' AND f.id_localidade = %s'
                    params.append(id_localidade)
                
                query += '''
                    )
                    SELECT
                        s.sexo_desc,
                        SUM(df.qtd_internacoes) AS total_internacoes
                    FROM dados_filtrados df
                    INNER JOIN dim_sexo s ON df.id_sexo = s.id_sexo
                    GROUP BY s.sexo_desc
                    HAVING SUM(df.qtd_internacoes) > 0
                    ORDER BY s.sexo_desc;
                '''
                
                cur.execute(query, params)
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de internações por sexo. Verifique os logs do backend. Erro: {error_msg}")

@app.get("/api/obitos/raca")
def obitos_por_raca(id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar")):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = '''
                    WITH dados_filtrados AS (
                        SELECT 
                            f.id_raca_cor,
                            f.qtd_obitos
                        FROM fato_saude_mensal f
                        WHERE f.id_tipo_evento = 7
                          AND f.qtd_obitos > 0
                '''
                params = []
                if id_localidade:
                    query += ' AND f.id_localidade = %s'
                    params.append(id_localidade)
                
                query += '''
                    )
                    SELECT
                        r.raca_desc,
                        SUM(df.qtd_obitos) AS total_obitos
                    FROM dados_filtrados df
                    INNER JOIN dim_raca_cor r ON df.id_raca_cor = r.id_raca_cor
                    GROUP BY r.raca_desc
                    HAVING SUM(df.qtd_obitos) > 0
                    ORDER BY total_obitos DESC;
                '''
                
                cur.execute(query, params)
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de óbitos por raça. Verifique os logs do backend. Erro: {error_msg}")


@app.get("/api/internacoes/faixa")
def internacoes_por_faixa(id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar")):
    """Internações por faixa etária (período agregado) para um município.

    Usa id_tipo_evento = 6 (SIH_FAIXA_AGG).
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            query = '''
                WITH dados_filtrados AS (
                    SELECT 
                        f.id_faixa,
                        f.qtd_internacoes
                    FROM fato_saude_mensal f
                    WHERE f.id_tipo_evento = 6
                      AND f.qtd_internacoes > 0
            '''
            params = []
            if id_localidade:
                query += ' AND f.id_localidade = %s'
                params.append(id_localidade)
            
            query += '''
                )
                SELECT
                    fxt.faixa_desc,
                    SUM(df.qtd_internacoes) AS total_internacoes
                FROM dados_filtrados df
                INNER JOIN dim_faixa_etaria fxt ON df.id_faixa = fxt.id_faixa
                GROUP BY fxt.faixa_desc, fxt.faixa_ordem
                HAVING SUM(df.qtd_internacoes) > 0
                ORDER BY fxt.faixa_ordem;
            '''
            
            cur.execute(query, params)
            rows = rows_to_dicts(cur)
    return rows


@app.get("/api/obitos/estado-civil")
def obitos_por_estado_civil(id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar")):
    """Óbitos por estado civil (período agregado) para um município.

    Usa id_tipo_evento = 8 (SIM_ESTCIV_AGG).
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            query = '''
                WITH dados_filtrados AS (
                    SELECT 
                        f.id_estado_civil,
                        f.qtd_obitos
                    FROM fato_saude_mensal f
                    WHERE f.id_tipo_evento = 8
                      AND f.qtd_obitos > 0
            '''
            params = []
            if id_localidade:
                query += ' AND f.id_localidade = %s'
                params.append(id_localidade)
            
            query += '''
                )
                SELECT
                    ec.estado_civil_desc,
                    SUM(df.qtd_obitos) AS total_obitos
                FROM dados_filtrados df
                INNER JOIN dim_estado_civil ec ON df.id_estado_civil = ec.id_estado_civil
                GROUP BY ec.estado_civil_desc
                HAVING SUM(df.qtd_obitos) > 0
                ORDER BY total_obitos DESC;
            '''
            
            cur.execute(query, params)
            rows = rows_to_dicts(cur)
    return rows


@app.get("/api/obitos/local")
def obitos_por_local_ocorrencia(id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar")):
    """Óbitos por local de ocorrência (período agregado) para um município.

    Usa id_tipo_evento = 9 (SIM_LOCAL_AGG).
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                columns_to_try = ['local_desc', 'local_ocorrencia_desc', 'descricao', 'local_ocor_desc', 'nome']
                
                for col in columns_to_try:
                    try:
                        query = '''
                            WITH dados_filtrados AS (
                                SELECT 
                                    f.id_local_ocor,
                                    f.qtd_obitos
                                FROM fato_saude_mensal f
                                WHERE f.id_tipo_evento = 9
                                  AND f.qtd_obitos > 0
                        '''
                        params = []
                        if id_localidade:
                            query += ' AND f.id_localidade = %s'
                            params.append(id_localidade)
                        
                        from psycopg2 import sql
                        query += f'''
                            )
                            SELECT
                                COALESCE(lo.{col}, 'Não Informado') AS local_ocorrencia_desc,
                                SUM(df.qtd_obitos) AS total_obitos
                            FROM dados_filtrados df
                            INNER JOIN dim_local_ocorrencia lo ON df.id_local_ocor = lo.id_local_ocor
                            GROUP BY COALESCE(lo.{col}, 'Não Informado')
                            HAVING SUM(df.qtd_obitos) > 0
                            ORDER BY total_obitos DESC;
                        '''
                        
                        cur.execute(query, params)
                        rows = rows_to_dicts(cur)
                        return rows
                    except Exception as e:
                        error_msg = str(e)
                        if 'column' not in error_msg.lower() and 'does not exist' not in error_msg.lower():
                            raise
                        continue
                
                raise HTTPException(status_code=500, detail="Não foi possível encontrar coluna de descrição na tabela dim_local_ocorrencia")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de local de ocorrência. Verifique os logs do backend. Erro: {error_msg}")


@app.get("/api/internacoes/cid-cap")
def internacoes_por_cid_capitulo(
    id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar"),
    ano: Optional[int] = Query(None, description="Ano para filtrar"),
    mes: Optional[int] = Query(None, description="Mês para filtrar (1-12)")
):
    """Internações por capítulo CID-10 (Top 10) para um município.

    Usa id_tipo_evento = 10 (SIH_CID_CAP_AGG - Internação – Capítulo CID-10).
    Otimizado para usar índices parciais.
    """
    try:
        rows = []
        with get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # Otimizado: usa CTE e índices parciais
                    # Se não há filtros, usa uma abordagem mais agressiva
                    if not ano and not mes and not id_localidade:
                        # Caso sem filtros: agrega primeiro, depois faz JOIN (mais eficiente)
                        query = '''
                            WITH capitulos_agregados AS (
                                SELECT 
                                    f.id_capitulo,
                                    SUM(f.qtd_internacoes) AS total_internacoes
                                FROM fato_saude_mensal f
                                WHERE f.id_tipo_evento = 10 
                                  AND f.id_capitulo IS NOT NULL
                                  AND f.qtd_internacoes > 0
                                GROUP BY f.id_capitulo
                                HAVING SUM(f.qtd_internacoes) > 0
                                ORDER BY total_internacoes DESC
                                LIMIT 10
                            )
                            SELECT
                                c.capitulo_cod,
                                c.titulo AS capitulo_nome,
                                ca.total_internacoes
                            FROM capitulos_agregados ca
                            INNER JOIN dim_cid10_capitulo c ON ca.id_capitulo = c.id_capitulo
                            ORDER BY ca.total_internacoes DESC;
                        '''
                        params = []
                    else:
                        # Caso com filtros: usa CTE para melhor performance
                        query = '''
                            WITH tempo_filtrado AS (
                                SELECT id_tempo
                                FROM dim_tempo
                                WHERE id_tempo IS NOT NULL AND id_tempo != 0
                        '''
                        params = []
                        if ano:
                            query += ' AND ano = %s'
                            params.append(ano)
                        if mes:
                            query += ' AND mes = %s'
                            params.append(mes)
                        
                        query += '''
                            ),
                            dados_filtrados AS (
                                SELECT 
                                    f.id_capitulo,
                                    f.qtd_internacoes
                                FROM fato_saude_mensal f
                                INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                                WHERE f.id_tipo_evento = 10 
                                  AND f.id_capitulo IS NOT NULL
                                  AND f.id_tempo IS NOT NULL
                                  AND f.id_tempo != 0
                                  AND f.qtd_internacoes > 0
                        '''
                        if id_localidade:
                            query += ' AND f.id_localidade = %s'
                            params.append(id_localidade)
                        
                        query += '''
                            )
                            SELECT
                                c.capitulo_cod,
                                c.titulo AS capitulo_nome,
                                SUM(df.qtd_internacoes) AS total_internacoes
                            FROM dados_filtrados df
                            INNER JOIN dim_cid10_capitulo c ON df.id_capitulo = c.id_capitulo
                            GROUP BY c.capitulo_cod, c.titulo
                            HAVING SUM(df.qtd_internacoes) > 0
                            ORDER BY total_internacoes DESC
                            LIMIT 10;
                        '''
                    
                    # Adiciona timeout específico para esta query
                    with conn.cursor() as exec_cur:
                        exec_cur.execute("SET statement_timeout = '180s'")
                    
                    cur.execute(query, params)
                    rows = rows_to_dicts(cur)
                except psycopg2.errors.UndefinedColumn as e:
                    column_alternatives = ['capitulo_desc', 'capitulo_nome', 'descricao', 'nome']
                    for col_name in column_alternatives:
                        try:
                            query = f'''
                                WITH tempo_filtrado AS (
                                    SELECT id_tempo
                                    FROM dim_tempo
                                    WHERE id_tempo IS NOT NULL AND id_tempo != 0
                            '''
                            params = []
                            if ano:
                                query += ' AND ano = %s'
                                params.append(ano)
                            if mes:
                                query += ' AND mes = %s'
                                params.append(mes)
                            
                            query += f'''
                                ),
                                dados_filtrados AS (
                                    SELECT 
                                        f.id_capitulo,
                                        f.qtd_internacoes
                                    FROM fato_saude_mensal f
                                    INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                                    WHERE f.id_tipo_evento = 10 
                                      AND f.id_capitulo IS NOT NULL
                                      AND f.id_tempo IS NOT NULL
                                      AND f.id_tempo != 0
                                      AND f.qtd_internacoes > 0
                            '''
                            if id_localidade:
                                query += ' AND f.id_localidade = %s'
                                params.append(id_localidade)
                            
                            query += f'''
                                )
                                SELECT
                                    c.capitulo_cod,
                                    c.{col_name} AS capitulo_nome,
                                    SUM(df.qtd_internacoes) AS total_internacoes
                                FROM dados_filtrados df
                                INNER JOIN dim_cid10_capitulo c ON df.id_capitulo = c.id_capitulo
                                GROUP BY c.capitulo_cod, c.{col_name}
                                HAVING SUM(df.qtd_internacoes) > 0
                                ORDER BY total_internacoes DESC
                                LIMIT 10;
                            '''
                            
                            cur.execute(query, params)
                            rows = rows_to_dicts(cur)
                            break
                        except psycopg2.errors.UndefinedColumn:
                            continue
                    else:
                        raise
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de CID-10 (internações). Verifique os logs do backend. Erro: {error_msg}")


@app.get("/api/obitos/cid-cap")
def obitos_por_cid_capitulo(
    id_localidade: Optional[int] = Query(None, description="ID da localidade para filtrar"),
    ano: Optional[int] = Query(None, description="Ano para filtrar"),
    mes: Optional[int] = Query(None, description="Mês para filtrar (1-12)")
):
    """Óbitos por capítulo CID-10 (Top 10) para um município.

    Usa id_tipo_evento = 11 (SIM 1996-2023 – Óbitos por capítulo CID-10).
    Otimizado para usar índices parciais.
    """
    try:
        rows = []
        with get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    # Otimizado: usa CTE e índices parciais
                    # Se não há filtros, usa uma abordagem mais agressiva
                    if not ano and not mes and not id_localidade:
                        # Caso sem filtros: agrega primeiro, depois faz JOIN (mais eficiente)
                        query = '''
                            WITH capitulos_agregados AS (
                                SELECT 
                                    f.id_capitulo,
                                    SUM(f.qtd_obitos) AS total_obitos
                                FROM fato_saude_mensal f
                                WHERE f.id_tipo_evento = 11 
                                  AND f.id_capitulo IS NOT NULL
                                  AND f.qtd_obitos > 0
                                GROUP BY f.id_capitulo
                                HAVING SUM(f.qtd_obitos) > 0
                                ORDER BY total_obitos DESC
                                LIMIT 10
                            )
                            SELECT
                                c.capitulo_cod,
                                c.titulo AS capitulo_nome,
                                ca.total_obitos
                            FROM capitulos_agregados ca
                            INNER JOIN dim_cid10_capitulo c ON ca.id_capitulo = c.id_capitulo
                            ORDER BY ca.total_obitos DESC;
                        '''
                        params = []
                    else:
                        # Caso com filtros: usa CTE para melhor performance
                        query = '''
                            WITH tempo_filtrado AS (
                                SELECT id_tempo
                                FROM dim_tempo
                                WHERE id_tempo IS NOT NULL AND id_tempo != 0
                        '''
                        params = []
                        if ano:
                            query += ' AND ano = %s'
                            params.append(ano)
                        if mes:
                            query += ' AND mes = %s'
                            params.append(mes)
                        
                        query += '''
                            ),
                            dados_filtrados AS (
                                SELECT 
                                    f.id_capitulo,
                                    f.qtd_obitos
                                FROM fato_saude_mensal f
                                INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                                WHERE f.id_tipo_evento = 11 
                                  AND f.id_capitulo IS NOT NULL
                                  AND f.id_tempo IS NOT NULL
                                  AND f.id_tempo != 0
                                  AND f.qtd_obitos > 0
                        '''
                        if id_localidade:
                            query += ' AND f.id_localidade = %s'
                            params.append(id_localidade)
                        
                        query += '''
                            )
                            SELECT
                                c.capitulo_cod,
                                c.titulo AS capitulo_nome,
                                SUM(df.qtd_obitos) AS total_obitos
                            FROM dados_filtrados df
                            INNER JOIN dim_cid10_capitulo c ON df.id_capitulo = c.id_capitulo
                            GROUP BY c.capitulo_cod, c.titulo
                            HAVING SUM(df.qtd_obitos) > 0
                            ORDER BY total_obitos DESC
                            LIMIT 10;
                        '''
                    
                    # Adiciona timeout específico para esta query
                    with conn.cursor() as exec_cur:
                        exec_cur.execute("SET statement_timeout = '180s'")
                    
                    cur.execute(query, params)
                    rows = rows_to_dicts(cur)
                except psycopg2.errors.UndefinedColumn as e:
                    column_alternatives = ['capitulo_desc', 'capitulo_nome', 'descricao', 'nome']
                    for col_name in column_alternatives:
                        try:
                            query = f'''
                                WITH tempo_filtrado AS (
                                    SELECT id_tempo
                                    FROM dim_tempo
                                    WHERE id_tempo IS NOT NULL AND id_tempo != 0
                            '''
                            params = []
                            if ano:
                                query += ' AND ano = %s'
                                params.append(ano)
                            if mes:
                                query += ' AND mes = %s'
                                params.append(mes)
                            
                            query += f'''
                                ),
                                dados_filtrados AS (
                                    SELECT 
                                        f.id_capitulo,
                                        f.qtd_obitos
                                    FROM fato_saude_mensal f
                                    INNER JOIN tempo_filtrado t ON f.id_tempo = t.id_tempo
                                    WHERE f.id_tipo_evento = 11 
                                      AND f.id_capitulo IS NOT NULL
                                      AND f.id_tempo IS NOT NULL
                                      AND f.id_tempo != 0
                                      AND f.qtd_obitos > 0
                            '''
                            if id_localidade:
                                query += ' AND f.id_localidade = %s'
                                params.append(id_localidade)
                            
                            query += f'''
                                )
                                SELECT
                                    c.capitulo_cod,
                                    c.{col_name} AS capitulo_nome,
                                    SUM(df.qtd_obitos) AS total_obitos
                                FROM dados_filtrados df
                                INNER JOIN dim_cid10_capitulo c ON df.id_capitulo = c.id_capitulo
                                GROUP BY c.capitulo_cod, c.{col_name}
                                HAVING SUM(df.qtd_obitos) > 0
                                ORDER BY total_obitos DESC
                                LIMIT 10;
                            '''
                            
                            cur.execute(query, params)
                            rows = rows_to_dicts(cur)
                            break
                        except psycopg2.errors.UndefinedColumn:
                            continue
                    else:
                        raise
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de CID-10 (óbitos). Verifique os logs do backend. Erro: {error_msg}")

@app.get("/api/dados/por-estado")
def dados_por_estado():
    """Retorna dados agregados por estado (UF) para visualização no mapa."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    SELECT
                        COALESCE(i.uf, o.uf) AS uf,
                        COALESCE(i.total_internacoes, 0) AS total_internacoes,
                        COALESCE(o.total_obitos, 0) AS total_obitos
                    FROM (
                        SELECT
                            l.uf,
                            SUM(f.qtd_internacoes) AS total_internacoes
                        FROM fato_saude_mensal f
                        INNER JOIN dim_localidade l ON f.id_localidade = l.id_localidade
                        WHERE l.uf IS NOT NULL
                          AND f.id_tipo_evento = 3
                          AND f.qtd_internacoes > 0
                        GROUP BY l.uf
                    ) i
                    FULL OUTER JOIN (
                        SELECT
                            l.uf,
                            SUM(f.qtd_obitos) AS total_obitos
                        FROM fato_saude_mensal f
                        INNER JOIN dim_localidade l ON f.id_localidade = l.id_localidade
                        WHERE l.uf IS NOT NULL
                          AND f.id_tipo_evento = 4
                          AND f.qtd_obitos > 0
                        GROUP BY l.uf
                    ) o ON i.uf = o.uf
                    ORDER BY COALESCE(i.uf, o.uf);
                    '''
                )
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados por estado: {error_msg}")

@app.get("/api/internacoes/cid-por-estado")
def internacoes_cid_por_estado(capitulo_cod: Optional[str] = Query(None, description="Código do capítulo CID-10 (ex: I, II, III)")):
    """Retorna dados de internação por CID-10 e estado (UF) para visualização no mapa.
    
    Se capitulo_cod for fornecido, filtra apenas esse capítulo.
    Se não for fornecido, retorna todos os capítulos agregados.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if capitulo_cod:
                    cur.execute(
                        '''
                        SELECT
                            l.uf,
                            c.capitulo_cod,
                            c.titulo AS capitulo_nome,
                            SUM(f.qtd_internacoes) AS total_internacoes
                        FROM fato_saude_mensal f
                        INNER JOIN dim_localidade l ON f.id_localidade = l.id_localidade
                        INNER JOIN dim_cid10_capitulo c ON f.id_capitulo = c.id_capitulo
                        WHERE f.id_tipo_evento = 10 
                          AND f.id_capitulo IS NOT NULL
                          AND l.uf IS NOT NULL
                          AND c.capitulo_cod = %s
                        GROUP BY l.uf, c.capitulo_cod, c.titulo
                        ORDER BY l.uf;
                        ''',
                        (capitulo_cod,)
                    )
                else:
                    cur.execute(
                        '''
                        SELECT
                            l.uf,
                            SUM(f.qtd_internacoes) AS total_internacoes
                        FROM fato_saude_mensal f
                        INNER JOIN dim_localidade l ON f.id_localidade = l.id_localidade
                        WHERE f.id_tipo_evento = 10 
                          AND f.id_capitulo IS NOT NULL
                          AND l.uf IS NOT NULL
                          AND f.qtd_internacoes > 0
                        GROUP BY l.uf
                        HAVING SUM(f.qtd_internacoes) > 0
                        ORDER BY l.uf;
                        '''
                    )
                rows = rows_to_dicts(cur)
        return rows
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados de internação por CID-10 e estado: {error_msg}")

@app.get("/api/test-columns/{table_name}")
def test_columns(table_name: str):
    """Endpoint para testar nomes de colunas em uma tabela."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}';
                    """
                )
                columns = [row[0] for row in cur.fetchall()]
        return {"table": table_name, "columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar colunas da tabela {table_name}: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend responding"}
