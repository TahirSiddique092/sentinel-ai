import click
from .auth import login
from .scan import scan

@click.group()
def cli():
    """SentinelAI — AI model security scanner."""
    pass

cli.add_command(login)
cli.add_command(scan)
