# Updating versions

## command.games

1. Make changes to [command.games.user.js](/src/command.games.user.js)
2. Run `python scripts/version.py command bump -b [patch|minor|major]`
3. Update the [CHANGELOG.md](/CHANGELOG.md)
4. Commit your changes
5. Run `python scripts/version.py command tag`
6. Push your changes, and make sure to do `git push --tags` as well

## monkeymaster

1. Make changes to [monkeymaster.js](/src/monkeymaster/monkeymaster.js)
2. Run `python scripts/version.py monkey bump -b [patch|minor|major]`
3. Update the [CHANGELOG.md](/src/monkeymaster/CHANGELOG.md)
4. Commit your changes
5. Run `python scripts/version.py monkey tag`
6. Push your changes, and make sure to do `git push --tags` as well
