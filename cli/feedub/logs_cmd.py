"""feedub logs - Stream service logs."""

from __future__ import annotations

import subprocess
import sys

from feedub.constants import LOG_DIR
from feedub.utils import error


VALID_SERVICES = ("backend", "frontend")


def logs_cmd(
    service: str | None = None, tail: int = 100, no_follow: bool = False
) -> None:
    """Stream logs from feedub services.

    Optionally specify a service name: backend, frontend.
    """
    if service and service not in VALID_SERVICES:
        error(
            f"Unknown service: [bold]{service}[/bold]. "
            f"Valid services: {', '.join(VALID_SERVICES)}"
        )
        raise SystemExit(1)

    services_to_show = [service] if service else list(VALID_SERVICES)

    for svc in services_to_show:
        log_file = LOG_DIR / f"{svc}.log"
        if not log_file.exists():
            error(f"No log file found for {svc}: {log_file}")
            continue

        if no_follow or len(services_to_show) > 1:
            # Print last N lines without following
            cmd = ["tail", f"-n{tail}", str(log_file)]
            try:
                subprocess.run(cmd, check=False)
            except KeyboardInterrupt:
                sys.exit(0)
        else:
            # Follow a single service log
            cmd = ["tail", f"-n{tail}", "-f", str(log_file)]
            try:
                proc = subprocess.run(cmd, check=False)
                sys.exit(proc.returncode)
            except KeyboardInterrupt:
                sys.exit(0)
