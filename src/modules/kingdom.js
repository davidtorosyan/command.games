// ==Module==
// @name         kingdom
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

(function() {
    'use strict';

    // logging
    const console = monkeymaster.setupConsole('command.kingdom');
    console.debug('Loaded');
    
    /* dominionrandomizer.com */

    // This section handles randomization.
    // It's expected to only run in an iFrame (see monkeymaster.executeJob).
    // Ideally shouldn't impact normal usage of dominionrandomizer.com
    if (window.location.host.indexOf(command.common.randomizerDomain) === -1) {
        return;
    }

    const deprecatedSets = new Map([
        ['baseset', 'baseset2'],
        ['intrigue', 'intrigue2'],
    ]);

    // run this callback when a job is found
    // tweak the settings, grab the card list, and return
    monkeymaster.executeJob((param, callback, failureCallback) => {
        $(document).ready(function() {
            if (uncheckDeprecatedSets()) {
                failureCallback(monkeymaster.errorCodes.RETRYABLE);
            }
            else {
                callback(getCardList());
            }
        });
    }, {
        nojob: monkeymaster.removeTrackingParams
    });

    // make sure that sets not included in dominion.games are not considered
    // return true if any changes were made
    function uncheckDeprecatedSets() {
        let changedSets = false;
        for (let [original, updated] of deprecatedSets) {
            changedSets |= replaceSet(original, updated);
        }
        return changedSets;
    }

    // return true if any changes were made
    function replaceSet(original, updated) {
        const $baseSet = $(`#${original}`);
        if ($baseSet.prop('checked')) {
            $baseSet.click();
            const $newSet = $(`#${updated}`);
            if (!$newSet.prop('checked')) {
                $newSet.click();
            }
            console.log(`Disabled ${original} and enabled ${updated}`);
            return true;
        }
        return false;
    }

    // grab the card info from the URL query params
    function getCardList() {
        return {
            cards: {
                colonies: getBool('colonies'),
                shelters: getBool('shelters'),
                supply: getList('supply'),
                events: getList('events'),
                landmarks: getList('landmarks'),
                projects: getList('projects'),
                ways: getList('ways')
            }
        };
    }

    function getBool(name) {
        return monkeymaster.getWindowQueryParam(name) == 1;
    }

    function getList(name) {
        return (monkeymaster.getWindowQueryParam(name) ?? '').split(',');
    }
})();