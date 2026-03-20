import re

import typer
from rich.table import Table

from feedub.constants import FEEDUB_HOME
from feedub.utils import console, error, success

app = typer.Typer()

_SENSITIVE_KEYS = {"TELEGRAM_API_HASH", "JWT_SECRET_KEY", "LLM_API_KEY"}


def _load_env() -> dict[str, str]:
    """Read ~/.feedub/.env into a dict (skipping comments and blanks)."""
    env_file = FEEDUB_HOME / ".env"
    if not env_file.exists():
        return {}
    result: dict[str, str] = {}
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            result[k.strip()] = v.strip()
    return result


def _mask(key: str, value: str) -> str:
    if key in _SENSITIVE_KEYS and len(value) > 4:
        return value[:4] + "****"
    return value


@app.callback(invoke_without_command=True)
def config(ctx: typer.Context) -> None:
    """Show or edit configuration (.env)."""
    if ctx.invoked_subcommand is None:
        show()


@app.command("show")
def show() -> None:
    """Display current config (sensitive values masked)."""
    env = _load_env()
    if not env:
        console.print(
            "[yellow]No config found.[/yellow] Run [bold]feedub init[/bold] first."
        )
        return

    table = Table(show_header=True, header_style="bold")
    table.add_column("Key")
    table.add_column("Value")
    for k, v in env.items():
        table.add_row(k, _mask(k, v))
    console.print(table)


@app.command("set")
def set_cmd(
    key: str = typer.Argument(..., help="Environment variable name (e.g. LLM_MODEL)"),
    value: str = typer.Argument(..., help="Value to set"),
) -> None:
    """Set a config value in .env."""
    env_file = FEEDUB_HOME / ".env"
    if not env_file.exists():
        error("No .env file found. Run [bold]feedub init[/bold] first.")
        raise typer.Exit(1)

    content = env_file.read_text()
    key = key.upper()

    # Try to update existing key (commented or uncommented)
    pattern = re.compile(rf"^#?\s*{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(content):
        content = pattern.sub(f"{key}={value}", content)
    else:
        # Append new key
        content = content.rstrip("\n") + f"\n{key}={value}\n"

    env_file.write_text(content)
    success(f"Set {key}={value}")


@app.command("get")
def get_cmd(
    key: str = typer.Argument(..., help="Environment variable name (e.g. LLM_MODEL)"),
) -> None:
    """Get a config value from .env."""
    env = _load_env()
    key = key.upper()
    val = env.get(key)
    if val is None:
        error(f"Key '{key}' not found in .env.")
        raise typer.Exit(1)
    console.print(val)


@app.command("path")
def path() -> None:
    """Show config file path."""
    console.print(str(FEEDUB_HOME / ".env"))
