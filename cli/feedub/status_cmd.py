"""feedub status - Show running service status."""

from __future__ import annotations

from rich.table import Table

from feedub.constants import BACKEND_PORT, DATA_DIR, FRONTEND_PORT, PID_DIR
from feedub.utils import console, info, is_process_alive, read_pid


def _disk_usage(path) -> str:
    """Return human-readable disk usage for a path."""
    if not path.exists():
        return "0 B"
    total = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    for unit in ("B", "KB", "MB", "GB"):
        if total < 1024:
            return f"{total:.1f} {unit}"
        total /= 1024
    return f"{total:.1f} TB"


def status_cmd() -> None:
    """Show status of feedub services."""
    services = [
        ("backend", PID_DIR / "backend.pid", str(BACKEND_PORT)),
        ("frontend", PID_DIR / "frontend.pid", str(FRONTEND_PORT)),
    ]

    table = Table(
        title="Feedub Services",
        show_header=True,
        header_style="bold cyan",
        border_style="dim",
    )
    table.add_column("Service", style="bold")
    table.add_column("Status")
    table.add_column("PID")
    table.add_column("Port")

    any_running = False
    for name, pid_file, port in services:
        pid = read_pid(pid_file)
        if pid and is_process_alive(pid):
            status_str = "[green]running[/green]"
            pid_str = str(pid)
            any_running = True
        else:
            status_str = "[red]stopped[/red]"
            pid_str = "-"
        table.add_row(name, status_str, pid_str, port)

    console.print(table)

    if not any_running:
        info("Feedub is not running. Use [bold]feedub run[/bold] to start.")

    usage = _disk_usage(DATA_DIR)
    console.print(f"\n[dim]Data directory:[/dim] {DATA_DIR}  [dim]({usage})[/dim]")
