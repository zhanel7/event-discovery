"""JWT и хэширование паролей (bcrypt)."""
import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import Role

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)

# Lazy initialization of CryptContext
_pwd_context = None
_bcrypt_available = None

def _get_pwd_context():
    global _pwd_context, _bcrypt_available
    if _pwd_context is None:
        try:
            from passlib.context import CryptContext
            _pwd_context = CryptContext(
                schemes=["bcrypt"],
                default="bcrypt",
                bcrypt__rounds=12,
                deprecated="auto"
            )
            _bcrypt_available = True
        except Exception as e:
            print(f"Warning: Bcrypt initialization failed ({e}), using fallback")
            _bcrypt_available = False
            _pwd_context = "fallback"
    return _pwd_context

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    pwd_context = _get_pwd_context()
    if _bcrypt_available:
        try:
            return pwd_context.hash(plain)
        except Exception:
            pass  # Fall through to fallback
    # Fallback to SHA256 with salt
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', plain.encode(), salt.encode(), 100000)
    return f"pbkdf2$sha256$100000${salt}${hashed.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    pwd_context = _get_pwd_context()
    if _bcrypt_available:
        try:
            return pwd_context.verify(plain, hashed)
        except Exception:
            pass  # Fall through to fallback
    # Fallback verification for PBKDF2
    if not hashed.startswith("pbkdf2$"):
        return False
    parts = hashed.split("$")
    if len(parts) != 5:
        return False
    _, algorithm, iterations, salt, digest = parts
    try:
        iterations_int = int(iterations)
    except ValueError:
        return False
    test_hash = hashlib.pbkdf2_hmac(algorithm, plain.encode(), salt.encode(), iterations_int)
    return test_hash.hex() == digest


def create_access_token(subject: str, user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": subject,
        "uid": user_id,
        "role": role,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str, user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": subject,
        "uid": user_id,
        "role": role,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    email: str = payload.get("sub")
    uid: str = payload.get("uid")
    if email is None or uid is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = get_user_by_id(db, uid)
    if user is None or user.email != email:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Compatibility aliases
get_password_hash = hash_password
