import sys

import typer

from feedub.constants import VERSION
from feedub.utils import console

app = typer.Typer()


@app.callback(invoke_without_command=True)
def version() -> None:
    """Show version information."""
    console.print(f"feedub [bold]{VERSION}[/bold]")
    console.print(f"Python {sys.version.split()[0]}")
