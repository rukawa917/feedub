import os

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


def kill_port(port: int) -> int | None:
    """Kill the process listening on a TCP port. Returns the PID if killed, else None."""
    import signal
    import subprocess

    try:
        result = subprocess.run(
            ["lsof", "-ti", f":{port}"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return None
        # lsof can return multiple PIDs (parent + child); kill all
        for line in result.stdout.strip().splitlines():
            pid = int(line.strip())
            try:
                os.kill(pid, signal.SIGTERM)
            except (ProcessLookupError, PermissionError):
                pass
        # Return the first PID for reporting
        return int(result.stdout.strip().splitlines()[0])
    except (ValueError, FileNotFoundError):
        return None
