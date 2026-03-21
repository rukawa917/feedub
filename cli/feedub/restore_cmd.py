"""feedub restore — Restore the Feedub database from a backup file."""

import shutil
from datetime import datetime
from pathlib import Path

import typer
from rich.table import Table

from feedub.constants import BACKUP_DIR, DB_FILE, PID_DIR
from feedub.utils import console, error, is_process_alive, read_pid, success, warning


def restore(
    file: str = typer.Argument(None, help="Path to the backup .db file to restore"),
    list_backups: bool = typer.Option(False, "--list", "-l", help="List available backups"),
) -> None:
    """Restore the Feedub database from a backup file."""

    if list_backups:
        _list_backups()
        return

    if not file:
        error("Provide a backup file path or use --list to see available backups.")
        raise typer.Exit(1)

    backup_path = Path(file)
    if not backup_path.exists():
        error(f"Backup file not found: {file}")
        raise typer.Exit(1)

    size = _human_size(backup_path.stat().st_size)
    console.print()
    console.print(f"[bold]Restore from:[/bold] {backup_path}")
    console.print(f"[dim]Size: {size}[/dim]")
    console.print()
    warning("This will replace ALL current data.")

    confirmed = typer.confirm("Continue?", default=False)
    if not confirmed:
        console.print("\n[dim]Restore cancelled.[/dim]")
        raise typer.Exit(0)

    console.print()

    # 1. Stop services
    _stop_services()

    # 2. Copy backup to DB_FILE location
    console.print("[dim]Restoring database...[/dim]")
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(backup_path, DB_FILE)
    success("Database restored")

    console.print()
    success("Restore complete!")
    console.print("[dim]Run 'feedub run' to restart services.[/dim]")
    console.print()


def _stop_services() -> None:
    """Send SIGTERM to running services and clean up PID files."""
    import os
    import signal

    for name in ("backend", "frontend"):
        pid_file = PID_DIR / f"{name}.pid"
        pid = read_pid(pid_file)
        if pid and is_process_alive(pid):
            try:
                os.kill(pid, signal.SIGTERM)
                console.print(f"[dim]Stopped {name} (pid {pid})[/dim]")
            except ProcessLookupError:
                pass
        pid_file.unlink(missing_ok=True)


def _list_backups() -> None:
    """List backup files in BACKUP_DIR sorted newest-first."""
    backup_dir = Path(BACKUP_DIR)
    if not backup_dir.exists():
        console.print(f"[dim]No backups found in {BACKUP_DIR}[/dim]")
        return

    backups = sorted(backup_dir.glob("*.db"), key=lambda p: p.stat().st_mtime, reverse=True)

    if not backups:
        console.print(f"[dim]No backups found in {BACKUP_DIR}[/dim]")
        return

    table = Table(title="Available Backups", show_header=True, header_style="bold cyan")
    table.add_column("File", style="white")
    table.add_column("Size", justify="right", style="dim")
    table.add_column("Date", style="dim")

    for bp in backups:
        stat = bp.stat()
        mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        table.add_row(bp.name, _human_size(stat.st_size), mtime)

    console.print()
    console.print(table)
    console.print("\n[dim]Run: feedub restore <file>[/dim]")
    console.print()


def _human_size(num_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes //= 1024
    return f"{num_bytes:.1f} TB"
