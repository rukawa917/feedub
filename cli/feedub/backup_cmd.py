"""feedub backup — Copy the SQLite database to a timestamped backup file."""

import shutil
from datetime import datetime
from pathlib import Path

import typer

from feedub.constants import BACKUP_DIR, DB_FILE
from feedub.utils import console, error, success


def backup(
    output: str = typer.Option(
        None, "--output", "-o", help="Custom output path (default: ~/.feedub/backups/feedub-<timestamp>.db)"
    ),
) -> None:
    """Create a database backup in ~/.feedub/backups/."""

    if not DB_FILE.exists():
        error(f"Database not found: {DB_FILE}")
        error("Run 'feedub init' and 'feedub run' first.")
        raise typer.Exit(1)

    backup_dir = Path(BACKUP_DIR)
    backup_dir.mkdir(parents=True, exist_ok=True)

    if output:
        backup_path = Path(output)
    else:
        timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
        backup_path = backup_dir / f"feedub-{timestamp}.db"

    console.print()
    console.print("[bold]Creating backup...[/bold]")
    console.print(f"[dim]Source: {DB_FILE}[/dim]")
    console.print(f"[dim]Destination: {backup_path}[/dim]")
    console.print()

    shutil.copy2(DB_FILE, backup_path)

    size = _human_size(backup_path.stat().st_size)
    success(f"Backup saved to {backup_path}")
    console.print(f"[dim]Size: {size}[/dim]")
    console.print()


def _human_size(num_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes //= 1024
    return f"{num_bytes:.1f} TB"
