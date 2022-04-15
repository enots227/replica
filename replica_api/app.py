import sys
from typing import Optional
from replica_api import app


def start(url: Optional[str]=None):
    host, port = '0.0.0.0', 80

    if url:
        host, port = url.split(':')

    app.run(host=host, port=int(port), dev=True, fast=False)


def main(argv):
    match argv:
        case ['start', url]:
            start(url)


if __name__ == '__main__':
    main(sys.argv[1:])

