#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import common.bump

common.bump.bump(
    'src/command.games.user.js', 
    'CHANGELOG.md', 
    'https://github.com/davidtorosyan/command.games', 
    sys.argv)