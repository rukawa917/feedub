import os
from pathlib import Path

FEEDUB_HOME = Path(os.environ.get("FEEDUB_HOME", "~/.feedub")).expanduser()
CONFIG_FILE = FEEDUB_HOME / "config.yml"
DATA_DIR = FEEDUB_HOME / "data"
BACKUP_DIR = FEEDUB_HOME / "backups"
LOG_DIR = FEEDUB_HOME / "logs"
PID_DIR = FEEDUB_HOME / "pids"
DB_FILE = DATA_DIR / "feedub.db"
VERSION = "0.1.0"

BACKEND_PORT = 8000
FRONTEND_PORT = 5173
