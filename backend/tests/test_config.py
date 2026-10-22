"""Database URL handling (run from backend/:  python tests/test_config.py)."""
import os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.update(DISABLE_SCHEDULER="1", DATABASE_URL="sqlite:///" + os.path.join(tempfile.mkdtemp(), "t.db"))
from app import normalize_db_url as n
checks = [
    ("postgres://u:p@h/db", "postgresql+psycopg2://u:p@h/db"),
    ("postgresql://u:p@h/db?sslmode=require&channel_binding=require", "postgresql+psycopg2://u:p@h/db?sslmode=require&channel_binding=require"),
    ("postgresql+psycopg2://u:p@h/db", "postgresql+psycopg2://u:p@h/db"),
    ("  postgresql://u:p@h/db  ", "postgresql+psycopg2://u:p@h/db"),
    ("sqlite:///x.db", "sqlite:///x.db"),
    ("", ""),
]
for given, want in checks:
    got = n(given)
    assert got == want, (given, got, want)
    print("  ✓", repr(given), "→", repr(got))
print(f"\nALL {len(checks)} CHECKS PASSED")
