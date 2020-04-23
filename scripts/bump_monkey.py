#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import common.bump

common.bump.bump(
    'src/monkeymaster/monkeymaster.js', 
    'src/monkeymaster/CHANGELOG.md', 
    'https://github.com/davidtorosyan/command.games', 
    sys.argv,
    prefix='monkeymaster')