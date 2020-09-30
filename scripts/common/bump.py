#!/usr/bin/env python
# -*- coding: utf-8 -*-

import datetime
import fileinput
import os
import re
import sys
import subprocess

def bump(path, changelog, repo, change, prefix='', modules=''):
    # helper
    def repo_root():
        return subprocess.Popen(['git', 'rev-parse', '--show-toplevel'], stdout=subprocess.PIPE).communicate()[0].rstrip().decode('utf-8')

    def from_root(path):
        return os.path.join(repo_root(), path)

    def update_version(major, minor, patch):
        if change == 'major':
            major += 1
            minor = 0
            patch = 0
        elif change == 'minor':
            minor += 1
            patch = 0
        elif change == 'patch':
            patch += 1
        return '{}.{}.{}'.format(major, minor, patch)

    # find version and increase
    pattern = re.compile('(^\s*//\s*@version\s+)(\d*)\.(\d*)\.(\d*)(.*\n)')
    module_pattern = re.compile('(^\s*//\s*@require\s+\S+/{}/\S+/v)(\d*)\.(\d*)\.(\d*)(.*\n)'.format(modules)) if modules else None
    version_old = None
    version = None
    for line in fileinput.FileInput(from_root(path), inplace=1):
        if not version:
            for match in re.finditer(pattern, line):
                start, major, minor, patch, end = match.group(1, 2, 3, 4, 5)
                version_old = '{}.{}.{}'.format(major, minor, patch)
                version = update_version(int(major), int(minor), int(patch))
                line = start + version + end
                break
        elif module_pattern:
            for match in re.finditer(module_pattern, line):
                start, major, minor, patch, end = match.group(1, 2, 3, 4, 5)
                line = start + version + end
                break
        print(line, end='')

    # log
    if version:
        print('Updating from {} to {}'.format(version_old, version))
    else:
        sys.exit('No version found!')

    # update changelog
    final_prefix = '' if prefix == '' else prefix+'-'
    found_tag = False
    found_unreleased = False
    for line in fileinput.FileInput(from_root(changelog), inplace=1):
        if not found_tag and line.startswith('[unreleased]'):
            found_tag = True
            print('[unreleased]: {}/compare/{}v{}...HEAD'.format(repo, final_prefix, version))
            print('[{}]: {}/compare/{}v{}...v{}'.format(version, repo, final_prefix, version_old, version))
        else:
            print(line, end='')
        if not found_unreleased and line.startswith('## [Unreleased]'):
            found_unreleased = True
            print('\n## [{}] - {}'.format(version, datetime.date.today()))