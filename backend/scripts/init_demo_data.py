"""
Инициализация демо-данных (конференции для примеров).
Запуск: python scripts/init_demo_data.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import get_password_hash  # noqa: E402
from crud import create_conference, create_user  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import Conference, User  # noqa: E402
from schemas import ConferenceCreate  # noqa: E402


def main():
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже демо-данные
        existing = db.query(Conference).filter(
            Conference.title.ilike('%DEMO%')
        ).first()
        if existing:
            print("Demo data already exists.")
            return

        # Создаём демо-пользователя
        demo_user = db.query(User).filter(User.email == "demo@example.com").first()
        if not demo_user:
            demo_user = create_user(
                db,
                email="demo@example.com",
                hashed_password=get_password_hash("Demo12345"),
                role="user"
            )
            print(f"Created demo user: {demo_user.email}")
        
        # Создаём примеры конференций
        now = datetime.now(timezone.utc)
        conferences = [
            ConferenceCreate(
                title="DEMO: International Conference on Machine Learning 2026",
                description="Leading conference on machine learning, deep learning, and AI.",
                start_date=now + timedelta(days=180),
                end_date=now + timedelta(days=185),
                location="Vancouver, Canada",
                cfp_deadline=now + timedelta(days=90),
                category="ML"
            ),
            ConferenceCreate(
                title="DEMO: Web Technologies Summit 2026",
                description="Latest trends in web development, React, Vue, Angular.",
                start_date=now + timedelta(days=120),
                end_date=now + timedelta(days=123),
                location="San Francisco, USA",
                cfp_deadline=now + timedelta(days=60),
                category="Web"
            ),
            ConferenceCreate(
                title="DEMO: Python Developer Conference 2026",
                description="Python ecosystem, FastAPI, Django, data science.",
                start_date=now + timedelta(days=150),
                end_date=now + timedelta(days=153),
                location="Amsterdam, Netherlands",
                cfp_deadline=now + timedelta(days=75),
                category="Python"
            ),
        ]
        
        for conf_data in conferences:
            conf = create_conference(db, conf_data, demo_user.id)
            print(f"Created demo conference: {conf.title} (ID: {conf.id})")
        
        print("\nDemo data initialized successfully!")
        print("\nTest credentials:")
        print("  Email: demo@example.com")
        print("  Password: Demo12345")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
