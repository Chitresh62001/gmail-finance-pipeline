import os
from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional, List, Dict
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# ─── Config ───────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Hardcoded admin user — change the password by regenerating the hash!
# Default password: money123
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "chitresh")
ADMIN_PASSWORD_HASH = "$2b$12$OWtwHzwbFG1RRWcOTUZspe8i2U34DRuGWn1cdfW7wS9ll/uuMcPhG"

# ─── App Setup ────────────────────────────────────────────────
app = FastAPI(title="Finance Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth Utilities ───────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

# ─── Database ─────────────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "finance_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

class Transaction(BaseModel):
    id: int
    account: str
    amount: float
    counterparty: str
    intent: str
    txn_date: datetime

# ─── Auth Endpoint ────────────────────────────────────────────
@app.post("/api/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME or not verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ─── Protected Endpoints ──────────────────────────────────────
@app.get("/api/filter-options")
def get_filter_options(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT DISTINCT account FROM transactions WHERE account IS NOT NULL")
        accounts = [row['account'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT DISTINCT intent FROM transactions WHERE intent IS NOT NULL")
        intents = [row['intent'] for row in cursor.fetchall()]
        
        return {
            "accounts": accounts,
            "intents": intents
        }
    except Exception as e:
        print(f"Error fetching filter options: {e}")
        return {"accounts": [], "intents": []}
    finally:
        cursor.close()
        conn.close()

@app.get("/api/transactions", response_model=List[Transaction])
def get_transactions(
    account: Optional[str] = Query(None, description="Filter by account"),
    counterparty: Optional[str] = Query(None, description="Filter by counterparty"),
    intent: Optional[str] = Query(None, description="Filter by intent"),
    amount_op: Optional[str] = Query(None, description="Amount operator (gt, lt, eq)"),
    amount_val: Optional[float] = Query(None, description="Amount value"),
    current_user: str = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = "SELECT id, account, amount, counterparty, intent, txn_date FROM transactions WHERE 1=1"
    params = []
    
    if account:
        query += " AND account = %s"
        params.append(account)
    if counterparty:
        query += " AND counterparty ILIKE %s"
        params.append(f"%{counterparty}%")
    if intent:
        query += " AND intent = %s"
        params.append(intent)
        
    if amount_op and amount_val is not None:
        if amount_op == "gt":
            query += " AND ABS(amount) > %s"
            params.append(amount_val)
        elif amount_op == "lt":
            query += " AND ABS(amount) < %s"
            params.append(amount_val)
        elif amount_op == "eq":
            query += " AND ABS(amount) = %s"
            params.append(amount_val)
            
    query += " ORDER BY txn_date DESC"
    
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        print(f"Error executing query: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
