import click
from .auth import login
from .scan import scan
from .logout import logout

@click.group()
def cli():
    """SentinelAI — AI model security scanner."""
    pass

cli.add_command(login)
cli.add_command(scan)
cli.add_command(logout)
