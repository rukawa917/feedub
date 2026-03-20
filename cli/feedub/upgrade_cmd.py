"""feedub upgrade — Upgrade the feedub package."""

import subprocess
import sys

import typer

from feedub.utils import console, error, success


def upgrade(
    check: bool = typer.Option(False, "--check", help="Check for updates without applying them"),
) -> None:
    """Upgrade feedub to the latest version."""

    if check:
        console.print()
        console.print("[bold]Checking for updates...[/bold]")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "index", "versions", "feedub"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            console.print(result.stdout.strip())
        else:
            console.print("[dim]Could not check for updates.[/dim]")
        console.print()
        return

    console.print()
    console.print("[bold]Upgrading Feedub...[/bold]")
    console.print()

    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "feedub"],
        check=False,
    )

    if result.returncode != 0:
        error("Upgrade failed.")
        raise typer.Exit(1)

    success("Feedub upgraded successfully!")
    console.print()
