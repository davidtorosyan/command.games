// ==Module==
// @name         kingdom
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

(function() {
    'use strict';

    /* dominionrandomizer.com */

    // This section handles randomization.
    // It's expected to only run in an iFrame (see monkeymaster.executeJob).
    // Ideally shouldn't impact normal usage of dominionrandomizer.com
    if (window.location.host.indexOf(command.common.randomizerDomain) === -1) {
        return;
    }
        
    // run this callback when a job is found
    // tweak the settings, grab the card list, and return
    monkeymaster.executeJob((param, callback) => {
        $(document).ready(function() {
            ensureDeprecatedSetsAreUnchecked(() => {
                callback(getCardList());
            });
        });
    }, {
        nojob: monkeymaster.removeTrackingParams
    });

    // make sure that sets not included in dominion.games are not considered
    function ensureDeprecatedSetsAreUnchecked(callback) {
        let shouldShuffle = false;
        shouldShuffle |= replaceSet('baseset', 'baseset2');
        shouldShuffle |= replaceSet('intrigue', 'intrigue2');
        if (shouldShuffle) {
            randomize(callback);
        }
        else {
            callback();
        }
    }

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

    function randomize(callback) {
        console.log('Randomizing');
        
        // clear the URL due to this bug:
        // https://github.com/blakevanlan/KingdomCreator/issues/51
        window.history.pushState({}, document.title, '/');

        // set a hash so we can monitor the URL update
        window.location.hash = 'tmp';
        $(window).on('hashchange', callback);
        
        // hit the randomize button
        $('.desktop_randomize-button')[0].click();
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