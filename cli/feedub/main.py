"""Feedub CLI — Self-hosted Telegram feed reader with AI insights."""

import typer

app = typer.Typer(
    name="feedub",
    help="Self-hosted Telegram feed reader with AI insights.",
    no_args_is_help=True,
)


# ── Core commands (worker-1) ─────────────────────────────────────────────────

from feedub.init_cmd import app as init_app  # noqa: E402
from feedub.config_cmd import app as config_app  # noqa: E402

app.add_typer(init_app, name="init", invoke_without_command=True)
app.add_typer(config_app, name="config")


@app.command("version")
def version() -> None:
    """Show Feedub version and environment info."""
    from feedub.version_cmd import version as _version

    _version()


# ── Service management commands ───────────────────────────────────────────────


@app.command("run")
def run(
    no_open: bool = typer.Option(
        False, "--no-open", help="Skip opening the browser after startup."
    ),
) -> None:
    """Start all services."""
    from feedub.run_cmd import run_cmd as _run

    _run(no_open=no_open)


@app.command("stop")
def stop(
    remove_data: bool = typer.Option(
        False,
        "--remove-data",
        help="Also remove all local data and backups (DESTRUCTIVE).",
    ),
) -> None:
    """Stop all services."""
    from feedub.stop_cmd import stop_cmd as _stop

    _stop(remove_data=remove_data)


@app.command("status")
def status() -> None:
    """Show service health."""
    from feedub.status_cmd import status_cmd as _status

    _status()


@app.command("logs")
def logs(
    service: str = typer.Argument(None, help="Service name: backend, frontend"),
    tail: int = typer.Option(
        100, "--tail", "-n", help="Number of lines to show from the end of logs."
    ),
    no_follow: bool = typer.Option(
        False, "--no-follow", help="Print logs and exit instead of following."
    ),
) -> None:
    """Tail logs from services."""
    from feedub.logs_cmd import logs_cmd as _logs

    _logs(service=service, tail=tail, no_follow=no_follow)


# ── Lifecycle commands (worker-3) ─────────────────────────────────────────────


@app.command("uninstall")
def uninstall(
    keep_data: bool = typer.Option(False, "--keep-data", help="Keep ~/.feedub/ data directory."),
    force: bool = typer.Option(False, "--force", help="Skip confirmation prompt."),
) -> None:
    """Complete removal of Feedub."""
    from feedub.uninstall_cmd import uninstall as _uninstall

    _uninstall(keep_data=keep_data, force=force)


@app.command("upgrade")
def upgrade(
    check: bool = typer.Option(False, "--check", help="Check for updates without applying them."),
) -> None:
    """Upgrade feedub to the latest version."""
    from feedub.upgrade_cmd import upgrade as _upgrade

    _upgrade(check=check)


@app.command("backup")
def backup(
    output: str = typer.Option(None, "--output", "-o", help="Custom output path for backup file."),
) -> None:
    """Export database to ~/.feedub/backups/."""
    from feedub.backup_cmd import backup as _backup

    _backup(output=output)


@app.command("restore")
def restore(
    file: str = typer.Argument(None, help="Backup file to restore (.db)"),
    list_backups: bool = typer.Option(False, "--list", "-l", help="List available backups."),
) -> None:
    """Restore from backup."""
    from feedub.restore_cmd import restore as _restore

    _restore(file=file, list_backups=list_backups)


if __name__ == "__main__":
    app()
