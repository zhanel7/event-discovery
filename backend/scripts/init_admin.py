"""Initialize admin user from environment variables."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import OperationalError

from auth import hash_password
from crud import create_user, get_user_by_email
from database import SessionLocal, Base, engine


def main():
    """Create admin user if it doesn't exist."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!")

    # Wait for database to be ready
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            # Create tables if they don't exist
            Base.metadata.create_all(bind=engine)

            db = SessionLocal()
            try:
                # Check if admin already exists
                existing_admin = get_user_by_email(db, admin_email)
                if existing_admin:
                    print(f"Admin user already exists: {admin_email}")
                    return

                # Create admin user
                try:
                    hashed_password = hash_password(admin_password)
                    admin_user = create_user(db, admin_email, hashed_password, "admin")
                    print(f"Admin user created: {admin_email}")
                except Exception as e:
                    print(f"Warning: Could not create admin user: {e}")
                return

            finally:
                db.close()

        except OperationalError as e:
            if attempt < max_attempts - 1:
                print(f"Database not ready, retrying... ({attempt + 1}/{max_attempts})")
                time.sleep(2)
            else:
                print(f"Failed to connect to database after {max_attempts} attempts: {e}")
                raise


if __name__ == "__main__":
    main()
