import secrets
from pathlib import Path

import typer
from rich.panel import Panel
from rich.prompt import Confirm, Prompt

from feedub.config import load_config, save_config
from feedub.constants import BACKUP_DIR, CONFIG_FILE, DATA_DIR, DB_FILE, FEEDUB_HOME, LOG_DIR, PID_DIR
from feedub.utils import console, error, info, success, warning

app = typer.Typer()

_ENV_TEMPLATE = """\
# ── Feedub Configuration ───────────────────────────────────────
# Edit this file, then run: feedub run

# ── Database (auto-configured) ────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///{db_file}

# ── Telegram API (required) ──────────────────────────────────
# Get your credentials from https://my.telegram.org/apps
TELEGRAM_API_ID=
TELEGRAM_API_HASH=

# ── Security (auto-generated) ────────────────────────────────
JWT_SECRET_KEY={jwt_secret}

# ── AI Insights (optional) ───────────────────────────────────
# Powered by LiteLLM — supports 100+ providers.
# Set LLM_ENABLED=true and configure a provider below.
LLM_ENABLED=false
# LLM_MODEL=ollama/llama3.2
# LLM_API_KEY=
# LLM_API_BASE=http://localhost:11434
"""


@app.callback(invoke_without_command=True)
def init() -> None:
    """Set up Feedub: detect project root, generate .env config."""
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Welcome to Feedub![/bold cyan]",
        border_style="cyan",
    ))
    console.print()

    env_path = FEEDUB_HOME / ".env"

    # Check if already initialized
    if env_path.exists():
        warning(f".env already exists at {env_path}")
        if not Confirm.ask("Overwrite?", default=False):
            info("Aborted.")
            raise typer.Exit(0)
        console.print()

    # ── Detect project source directory ───────────────────────────────
    cwd = Path.cwd()
    backend_marker = cwd / "backend" / "src" / "main.py"
    frontend_marker = cwd / "frontend" / "package.json"

    if backend_marker.exists() and frontend_marker.exists():
        source_dir = str(cwd)
        success(f"Detected project root: {source_dir}")
    else:
        warning("Could not detect project root in current directory.")
        info("Run this command from the feedub repository root, or enter the path:")
        source_dir = Prompt.ask("   Project root path", default=str(cwd))
        sd = Path(source_dir).expanduser().resolve()
        if not (sd / "backend" / "src" / "main.py").exists():
            error(f"backend/src/main.py not found in {sd}")
            raise typer.Exit(1)
        if not (sd / "frontend" / "package.json").exists():
            error(f"frontend/package.json not found in {sd}")
            raise typer.Exit(1)
        source_dir = str(sd)

    # ── Create directories ────────────────────────────────────────────
    for d in (DATA_DIR, BACKUP_DIR, LOG_DIR, PID_DIR):
        d.mkdir(parents=True, exist_ok=True)

    # ── Generate .env ─────────────────────────────────────────────────
    jwt_secret = secrets.token_urlsafe(48)
    env_content = _ENV_TEMPLATE.format(db_file=DB_FILE, jwt_secret=jwt_secret)
    env_path.write_text(env_content)

    # ── Save CLI config (source_dir only) ─────────────────────────────
    save_config({"source_dir": source_dir})

    # ── Done ──────────────────────────────────────────────────────────
    console.print()
    success(f"Config written to [bold]{env_path}[/bold]")
    console.print()
    console.print(Panel.fit(
        "[bold]Next steps:[/bold]\n"
        f"  1. Edit [cyan]{env_path}[/cyan] — add your Telegram API credentials\n"
        "  2. Run [green]feedub run[/green]",
        border_style="dim",
    ))
    console.print()
