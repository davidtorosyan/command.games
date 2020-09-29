#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import common.bump
import common.tag

def main():
    args = process_args()
    if args.script == 'command':
        if args.operation == 'bump':
            common.bump.bump(
                'src/command.games.user.js',
                'CHANGELOG.md',
                'https://github.com/davidtorosyan/command.games',
                args.bump_type,
                modules='command.games')
        elif args.operation == 'tag':
            common.tag.tag(
                'src/command.games.user.js')
        else:
            sys.exit('Unsupported option')
    else:
        if args.operation == 'bump':
            common.bump.bump(
                'src/monkeymaster/monkeymaster.js',
                'src/monkeymaster/CHANGELOG.md',
                'https://github.com/davidtorosyan/command.games',
                args.bump_type,
                prefix='monkeymaster')
        elif args.operation == 'tag':
            common.tag.tag(
                'src/monkeymaster/monkeymaster.js',
                prefix='monkeymaster')
        else:
            sys.exit('Unsupported option')

def process_args():
    parser = QuietArgumentParser(description='Updates versions.')
    parser.add_argument(
        'script',
        choices=['command', 'monkey'],
        help='the script to version')
    parser.add_argument(
        'operation',
        choices=['bump', 'tag', 'auto'],
        default='auto',
        help='the versioning operation')
    parser.add_argument(
        '-b', '--bump-type',
        choices=['major', 'minor', 'patch'],
        required='bump' in sys.argv,
        help='the bump type')
    try:
        return parser.parse_args()
    except KeyboardInterrupt:
        sys.exit('\nQuitting.')
    except ArgumentParserError as ex:
        sys.exit('Invalid args: {}'.format(str(ex)))

class ArgumentParserError(Exception):
    """This exception represents an error while parsing arguments."""

class QuietArgumentParser(argparse.ArgumentParser):
    """This class is for silent argument parsing."""

    def error(self, message):
        """Throw a useful error instead of exiting the program."""
        raise ArgumentParserError(message)

if __name__ == "__main__":
    main()