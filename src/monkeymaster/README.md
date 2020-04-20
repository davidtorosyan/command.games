# monkeymaster

## Table of contents

- [Introduction](#introduction)
- [Setup](#setup)
- [Usage](#usage)
- [License](#license)

## Introduction

This is a library for TamperMonkey script helpers.

## Setup

Install [TamperMonkey](https://www.tampermonkey.net/) to your favorite web browser.

Begin authoring a userscript, and include monkeymaster.js as a requirement:
```javascript
// @require      https://github.com/davidtorosyan/command.games/raw/monkeymaster-v1.1.0/src/monkeymaster/monkeymaster.js
```

Take note of the version you're importing, and check the [changelog](CHANGELOG.md) for updates.

You can use `master` instead of a specific version, but there may be behavior or breaking changes in accordance with [semantic versioning](https://semver.org/spec/v2.0.0.html). 

## Usage

The public API of the library is documented inline, so check out [monkeymaster.js](monkeymaster.js).

Each section contains a list of additional requirements (`@grant` and `@require` directives) so be sure to include those as well.

## License
[MIT](https://choosealicense.com/licenses/mit/)
