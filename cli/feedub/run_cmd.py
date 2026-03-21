"""feedub run - Start all feedub services as local processes."""

from __future__ import annotations

import subprocess
import time
import webbrowser
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from rich.progress import Progress, SpinnerColumn, TextColumn

from feedub.config import load_config
from feedub.constants import BACKEND_PORT, CONFIG_FILE, FEEDUB_HOME, LOG_DIR, PID_DIR
from feedub.utils import (
    console,
    error,
    info,
    is_process_alive,
    read_pid,
    success,
    write_pid,
)


BACKEND_HEALTH_URL = f"http://localhost:{BACKEND_PORT}/health/live"
FRONTEND_URL = "http://localhost:5173"
HEALTH_POLL_INTERVAL = 3  # seconds
HEALTH_TIMEOUT = 120  # seconds


def _wait_for_backend(timeout: int = HEALTH_TIMEOUT) -> bool:
    """Poll the backend /health endpoint until it responds or timeout."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(BACKEND_HEALTH_URL, timeout=5) as resp:
                if resp.status == 200:
                    return True
        except (URLError, OSError):
            pass
        time.sleep(HEALTH_POLL_INTERVAL)
    return False


def run_cmd(no_open: bool = False) -> None:
    """Start all feedub services."""
    # 1. Check config exists
    if not CONFIG_FILE.exists():
        error(
            "No configuration found. Run [bold]feedub init[/bold] first to set up feedub."
        )
        raise SystemExit(1)

    # 2. Resolve source directories
    config = load_config()
    source_dir = config.get("source_dir")
    if not source_dir:
        error(
            "Project source directory not configured.\n"
            "Run [bold]feedub init[/bold] again from the project root."
        )
        raise SystemExit(1)

    backend_dir = Path(source_dir) / "backend"
    frontend_dir = Path(source_dir) / "frontend"

    if not backend_dir.exists():
        error(f"Backend directory not found: {backend_dir}")
        raise SystemExit(1)
    if not frontend_dir.exists():
        error(f"Frontend directory not found: {frontend_dir}")
        raise SystemExit(1)

    # 3. Check if already running
    backend_pid_file = PID_DIR / "backend.pid"
    frontend_pid_file = PID_DIR / "frontend.pid"
    existing_pid = read_pid(backend_pid_file)
    if existing_pid and is_process_alive(existing_pid):
        info("Feedub is already running. Use [bold]feedub status[/bold] to check.")
        return

    # 4. Ensure directories exist
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    PID_DIR.mkdir(parents=True, exist_ok=True)

    # 5. Load environment from ~/.feedub/.env
    env_file = FEEDUB_HOME / ".env"
    env: dict[str, str] = {}
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()

    # Validate required env vars
    missing = [k for k in ("TELEGRAM_API_ID", "TELEGRAM_API_HASH") if not env.get(k)]
    if missing:
        error(
            f"Missing required config: [bold]{', '.join(missing)}[/bold]\n"
            f"Edit [bold]{env_file}[/bold] to add your Telegram credentials."
        )
        raise SystemExit(1)

    import os

    proc_env = {**os.environ, **env}

    # 6. Install dependencies & run migrations
    console.print("[dim]Installing backend dependencies...[/dim]")
    dep_result = subprocess.run(
        ["uv", "sync"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        env=proc_env,
    )
    if dep_result.returncode != 0:
        error(f"Failed to install backend dependencies:\n{dep_result.stderr}")
        raise SystemExit(1)

    console.print("[dim]Installing frontend dependencies...[/dim]")
    dep_result = subprocess.run(
        ["npm", "install"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        env=proc_env,
    )
    if dep_result.returncode != 0:
        error(f"Failed to install frontend dependencies:\n{dep_result.stderr}")
        raise SystemExit(1)

    console.print("[dim]Running database migrations...[/dim]")
    migrate_result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        env=proc_env,
    )
    if migrate_result.returncode != 0:
        error(f"Database migration failed:\n{migrate_result.stderr}")
        raise SystemExit(1)

    # 7. Start backend
    console.print("[dim]Starting backend...[/dim]")
    backend_log = open(LOG_DIR / "backend.log", "a")
    backend_proc = subprocess.Popen(
        [
            "uv",
            "run",
            "uvicorn",
            "src.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(BACKEND_PORT),
        ],
        cwd=backend_dir,
        stdout=backend_log,
        stderr=backend_log,
        env=proc_env,
    )
    write_pid(backend_pid_file, backend_proc.pid)

    # 8. Start frontend
    console.print("[dim]Starting frontend...[/dim]")
    frontend_log = open(LOG_DIR / "frontend.log", "a")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        stdout=frontend_log,
        stderr=frontend_log,
        env=proc_env,
    )
    write_pid(frontend_pid_file, frontend_proc.pid)

    # 9. Wait for backend health
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        progress.add_task("Waiting for backend to become healthy...", total=None)
        healthy = _wait_for_backend()

    if not healthy:
        error(
            f"Backend did not become healthy within {HEALTH_TIMEOUT}s.\n"
            "Run [bold]feedub logs backend[/bold] to diagnose."
        )
        raise SystemExit(1)

    # 10. Success
    success(f"Feedub is running at [link={FRONTEND_URL}]{FRONTEND_URL}[/link]")

    # 11. Open browser
    if not no_open:
        try:
            webbrowser.open(FRONTEND_URL)
        except Exception:
            pass
