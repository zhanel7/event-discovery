"""Создание администратора из переменных окружения (однократно)."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import OperationalError  # noqa: E402

from auth import get_password_hash, get_user_by_email  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from models import User  # noqa: E402


def main():
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("ADMIN_PASSWORD", "Admin12345")
    last_err = None

    for attempt in range(30):
        try:
            # До uvicorn: таблицы должны существовать до init_admin (lifespan ещё не выполнялся).
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                if get_user_by_email(db, email):
                    return
                u = User(email=email, hashed_password=get_password_hash(password), role="admin")
                db.add(u)
                db.commit()
                print(f"Admin user created: {email}")
                return
            except OperationalError as e:
                last_err = e
                db.rollback()
                print(f"Waiting for database... ({attempt + 1}/30)")
                time.sleep(2)
            finally:
                db.close()
        except OperationalError as e:
            last_err = e
            print(f"Waiting for database (schema)... ({attempt + 1}/30)")
            time.sleep(2)

    raise SystemExit(f"Database unavailable after retries: {last_err}")


if __name__ == "__main__":
    main()
