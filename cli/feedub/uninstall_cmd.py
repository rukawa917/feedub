"""feedub uninstall — Complete self-removal of Feedub and all its data."""

import shutil
import subprocess
import sys

import typer
from rich.panel import Panel

from feedub.constants import FEEDUB_HOME
from feedub.utils import console, error, success, warning


def uninstall(
    keep_data: bool = typer.Option(
        False, "--keep-data", help="Keep ~/.feedub/ data directory (remove CLI only)"
    ),
    force: bool = typer.Option(False, "--force", help="Skip confirmation prompt"),
) -> None:
    """Completely remove Feedub: data and the CLI itself."""

    items = []
    if not keep_data:
        items.append(f"All data in {FEEDUB_HOME}/ (database, config, backups)")
    items.append("The feedub CLI tool itself")

    bullet_lines = "\n".join(f"  [bold red]✗[/bold red] {item}" for item in items)

    console.print()
    console.print(
        Panel(
            f"{bullet_lines}\n\n[bold]This action is irreversible.[/bold]",
            title="[bold red]Uninstall Feedub[/bold red]",
            border_style="red",
        )
    )

    if not force:
        confirmed = typer.confirm("\nContinue?", default=False)
        if not confirmed:
            console.print("\n[dim]Uninstall cancelled.[/dim]")
            raise typer.Exit(0)

    console.print()

    # 1. Stop running services and free ports
    from feedub.stop_cmd import stop_cmd

    stop_cmd()

    # 2. Remove ~/.feedub/ unless --keep-data
    if not keep_data:
        feedub_home = FEEDUB_HOME
        if feedub_home.exists():
            try:
                shutil.rmtree(feedub_home)
                success(f"Deleted {FEEDUB_HOME}/")
            except Exception as exc:
                error(f"Failed to delete {FEEDUB_HOME}/: {exc}")
        else:
            warning(f"{FEEDUB_HOME}/ not found — nothing to delete")
    else:
        console.print(f"[dim]Kept {FEEDUB_HOME}/ (--keep-data)[/dim]")

    # 3. Print goodbye BEFORE self-removal
    success("Uninstalled feedub package")
    console.print()
    console.print(
        "[bold green]Feedub has been completely removed. Goodbye![/bold green]"
    )
    console.print()

    # 4. Self-remove — MUST be last action
    subprocess.run(
        [sys.executable, "-m", "pip", "uninstall", "feedub", "-y"],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    sys.exit(0)
