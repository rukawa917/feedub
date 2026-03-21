"""feedub stop - Stop all feedub services."""

from __future__ import annotations

import os
import signal

import typer

from feedub.constants import BACKEND_PORT, DATA_DIR, FRONTEND_PORT, PID_DIR
from feedub.utils import console, is_process_alive, kill_port, read_pid, success, warning


def stop_cmd(remove_data: bool = False) -> None:
    """Stop all feedub services."""
    backend_pid_file = PID_DIR / "backend.pid"
    frontend_pid_file = PID_DIR / "frontend.pid"

    stopped_any = False

    for name, pid_file, port in [
        ("backend", backend_pid_file, BACKEND_PORT),
        ("frontend", frontend_pid_file, FRONTEND_PORT),
    ]:
        pid = read_pid(pid_file)
        if pid is not None and is_process_alive(pid):
            try:
                os.kill(pid, signal.SIGTERM)
                success(f"Stopped {name} (pid {pid})")
                stopped_any = True
            except ProcessLookupError:
                pass
        pid_file.unlink(missing_ok=True)

        # Fallback: kill whatever is on the port if PID file was stale/missing
        port_pid = kill_port(port)
        if port_pid is not None:
            success(f"Freed port {port} (pid {port_pid})")
            stopped_any = True

    if not stopped_any:
        warning("No running feedub processes found.")

    if remove_data:
        warning(
            "[bold yellow]WARNING:[/bold yellow] This will permanently delete all feedub data "
            "including your Telegram session and message history."
        )
        confirmed = typer.confirm("Are you sure you want to remove all data?", default=False)
        if not confirmed:
            console.print("Aborted.")
            return

        import shutil

        if DATA_DIR.exists():
            shutil.rmtree(DATA_DIR)
        success("All data removed.")
    else:
        if stopped_any:
            success(f"Feedub stopped. Data preserved in [bold]{DATA_DIR}[/bold]")
