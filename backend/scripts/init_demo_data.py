"""Initialize demo data for testing purposes."""
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crud import create_conference, create_user, get_user_by_email
from database import SessionLocal, Base, engine
from schemas import ConferenceCreate


def main():
    """Create demo user and sample conferences."""
    # Ensure tables exist before creating demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if demo data already exists
        from models import Conference
        demo_conferences = db.query(Conference).filter(
            Conference.title.like("DEMO:%")
        ).count()
        if demo_conferences > 0:
            print("Demo data already exists.")
            return

        # Create demo user if not exists
        demo_email = "demo@example.com"
        demo_user = get_user_by_email(db, demo_email)
        if not demo_user:
            from auth import get_password_hash
            demo_user = create_user(
                db,
                email=demo_email,
                hashed_password=get_password_hash("Demo123!"),
                role="user"
            )
            print(f"Created demo user: {demo_email}")

        # Create sample conferences
        now = datetime.now(timezone.utc)
        conferences_data = [
            ConferenceCreate(
                title="DEMO: International Conference on Machine Learning 2026",
                description="Leading conference on machine learning, deep learning, and AI research.",
                start_date=now + timedelta(days=180),
                end_date=now + timedelta(days=185),
                location="Vancouver, Canada",
                cfp_deadline=now + timedelta(days=90),
                category="Machine Learning"
            ),
            ConferenceCreate(
                title="DEMO: Web Technologies Summit 2026",
                description="Latest trends in web development, React, Vue.js, and modern frameworks.",
                start_date=now + timedelta(days=120),
                end_date=now + timedelta(days=123),
                location="San Francisco, USA",
                cfp_deadline=now + timedelta(days=60),
                category="Web Development"
            ),
            ConferenceCreate(
                title="DEMO: Python Developer Conference 2026",
                description="Python ecosystem, FastAPI, Django, data science, and best practices.",
                start_date=now + timedelta(days=150),
                end_date=now + timedelta(days=153),
                location="Amsterdam, Netherlands",
                cfp_deadline=now + timedelta(days=75),
                category="Python"
            ),
            ConferenceCreate(
                title="DEMO: Cybersecurity Conference 2026",
                description="Information security, ethical hacking, and cybersecurity trends.",
                start_date=now + timedelta(days=200),
                end_date=now + timedelta(days=203),
                location="Berlin, Germany",
                cfp_deadline=now + timedelta(days=100),
                category="Security"
            ),
            ConferenceCreate(
                title="DEMO: Data Science Summit 2026",
                description="Big data, analytics, visualization, and data-driven decision making.",
                start_date=now + timedelta(days=90),
                end_date=now + timedelta(days=93),
                location="London, UK",
                cfp_deadline=now + timedelta(days=45),
                category="Data Science"
            ),
        ]

        for conf_data in conferences_data:
            conference = create_conference(db, conf_data, demo_user.id)
            print(f"Created demo conference: {conference.title}")

        print("\nDemo data initialized successfully!")
        print("\nDemo user credentials:")
        print(f"  Email: {demo_email}")
        print("  Password: Demo123!")
        print("\nYou can now login and explore the application.")

    except Exception as e:
        db.rollback()
        print(f"Error initializing demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
