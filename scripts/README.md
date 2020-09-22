# Updating versions

## command.games

1. Make changes to [command.games.user.js](/src/command.games.user.js)
2. Run `python scripts/bump_command.py [patch|minor|major]`
3. Update the [CHANGELOG.md](/CHANGELOG.md)
4. Commit your changes
5. Run `python scripts/tag_command.py`
6. Push your changes, and make sure to do `git push --tags` as well

## monkeymaster

1. Make changes to [monkeymaster.js](/src/monkeymaster/monkeymaster.js)
2. Run `python scripts/bump_monkey.py [patch|minor|major]`
3. Update the [CHANGELOG.md](/src/monkeymaster/CHANGELOG.md)
4. Commit your changes
5. Run `python scripts/tag_monkey.py`
6. Push your changes, and make sure to do `git push --tags` as well
