import os
import signal

from rich.console import Console

console = Console()


def success(msg: str) -> None:
    console.print(f"[green]✓[/green] {msg}")


def error(msg: str) -> None:
    console.print(f"[red]✗[/red] {msg}", style="red")


def warning(msg: str) -> None:
    console.print(f"[yellow]![/yellow] {msg}", style="yellow")


def info(msg: str) -> None:
    console.print(f"  {msg}")


def read_pid(pid_file) -> int | None:
    """Read a PID from a file. Returns None if file missing or invalid."""
    try:
        return int(pid_file.read_text().strip())
    except (FileNotFoundError, ValueError):
        return None


def write_pid(pid_file, pid: int) -> None:
    """Write a PID to a file, creating parent dirs as needed."""
    pid_file.parent.mkdir(parents=True, exist_ok=True)
    pid_file.write_text(str(pid))


def is_process_alive(pid: int) -> bool:
    """Return True if a process with the given PID is running."""
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError):
        return False
