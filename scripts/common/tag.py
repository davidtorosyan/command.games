#!/usr/bin/env python
# -*- coding: utf-8 -*-

import datetime
import fileinput
import os
import re
import sys
import subprocess

def tag(path, prefix=''):
    # helper
    def repo_root():
        return subprocess.Popen(['git', 'rev-parse', '--show-toplevel'], stdout=subprocess.PIPE).communicate()[0].rstrip().decode('utf-8')

    def from_root(path):
        return os.path.join(repo_root(), path)

    def add_tag(tag):
        return subprocess.Popen(['git', 'tag', tag], stdout=subprocess.PIPE).communicate()[0].rstrip().decode('utf-8')

    # find version and increase
    pattern = re.compile('^\s*//\s*@version\s+(\d*\.\d*\.\d*)')
    version = None
    for i, line in enumerate(open(from_root(path))):
        for match in re.finditer(pattern, line):
            version = match.group(1)
            break

    # log
    if version:
        print('Found version {}'.format(version))
    else:
        sys.exit('No version found!')
    
    final_prefix = '' if prefix == '' else prefix+'-'
    tag = '{}v{}'.format(final_prefix, version)
    print('Adding tag {}'.format(tag))
    add_tag(tag)