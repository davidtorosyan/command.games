# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2020-09-21

### Fixed

- Log exceptions from failed job callbacks.

## [1.3.0] - 2020-09-19

### Added

- Expose jobContainerId for CSS manipulation

## [1.2.0] - 2020-04-24

### Fixed

- queueJob respects existing query parameters

### Added

- New helpers for query parameters
- completionCleanupDelayMs option for queueJob
- nojob option for executeJob

### Deprecated 

- getQueryParameter helper
- skipCleanupOnCompletion option for queueJob

## [1.1.0] - 2020-04-19

### Changed

- Modified how job data is stored and cleaned up. 
  Now, by default, job data is deleted upon job completion.

### Added

- cleanupJobStorage API

## [1.0.0] - 2020-04-19

### Added

- monkeymaster library

[unreleased]: https://github.com/davidtorosyan/command.games/compare/monkeymaster-v1.3.1...HEAD
[1.3.1]: https://github.com/davidtorosyan/command.games/compare/monkeymaster-v1.3.0...v1.3.1
[1.3.0]: https://github.com/davidtorosyan/command.games/compare/monkeymaster-v1.2.0...v1.3.0
[1.2.0]: https://github.com/davidtorosyan/command.games/compare/monkeymaster-v1.1.0...v1.2.0
[1.1.0]: https://github.com/davidtorosyan/command.games/compare/monkeymaster-v1.0.0...monkeymaster-v1.1.0
[1.0.0]: https://github.com/davidtorosyan/command.games/releases/tag/monkeymaster-v1.0.0
