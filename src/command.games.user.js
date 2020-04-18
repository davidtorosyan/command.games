// ==UserScript==
// @name         command.games
// @namespace    https://github.com/davidtorosyan/command.games
// @version      1.0.0
// @description  improve dominion.games
// @author       David Torosyan
// @match        https://dominion.games/
// @match        https://dominionrandomizer.com/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://github.com/davidtorosyan/command.games/raw/master/src/monkeymaster.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// ==/UserScript==

(function() {
    'use strict';

    // automatically navigates to the kingdom card selection page
    const DEVELOPER_MODE = window.DEVELOPER_MODE;

    // setup the helper library
    const console = monkeymaster.setupConsole('command.games');
    console.log('Loaded');
    monkeymaster.setupJobs('command.games');

    if (DEVELOPER_MODE) {
        console.log('Running in developer mode');
    }

    /* dominionrandomizer.com */

    // This section handles randomization.
    // It's expected to only run in an iFrame (see monkeymaster.executeJob).
    // Ideally shouldn't impact normal usage of dominionrandomizer.com
    if (window.location.host.indexOf('dominionrandomizer.com') !== -1) {
        
        // run this callback when a job is found
        // tweak the settings, grab the card list, and return
        monkeymaster.executeJob((param, callback) => {
            $(document).ready(function() {
                ensureDeprecatedSetsAreUnchecked(() => {
                    callback(getCardList());
                });
            });
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
            return monkeymaster.getQueryParameter(name) == 1;
        }

        function getList(name) {
            return monkeymaster.getQueryParameter(name).split(',');
        }

        // important! return to avoid running the rest of the script
        return;
    }

    /* dominion.games */

    // main
    $(document).ready(function() {
        setup();
        if (DEVELOPER_MODE) {
            navigate();
        }
    });

    function setup() {
        // every time the user navigates to the "choose cards" page,
        $.onExists('.kingdom-choices', () => {
            console.debug('Found kingdom choices');

            // rename the "Clear Selection" button to save room
            const $clearButton = $('.clear-kingdom');
            $clearButton.val('Clear');

            // add a Random! button
            const $randomize = $('<input type="button" class="lobby-button random-kingdom" style="font-size:1.2vw;" value="Random!"></input>');
            $randomize.on('click', tryRandomize);
            $randomize.insertAfter($clearButton);
        });
    }

    // run randomization, making sure that running processes are canceled
    let randomizerCancelTokenSource;
    function tryRandomize() {
        if (randomizerCancelTokenSource !== undefined) {
            randomizerCancelTokenSource.cancel();
        }
        randomizerCancelTokenSource = monkeymaster.cancelTokenSource();
        const $randomize = $('.random-kingdom');
        $randomize.val('Running...');
        randomize(randomizerCancelTokenSource.getToken(), () => {
            $randomize.val('Random!');
        });
    }

    // randomize! see executeJob at the top of the script for how we get data from the other site.
    function randomize(cancelToken, callback) {
        console.log('Random!');
        clearCards();
        monkeymaster.queueJob('https://dominionrandomizer.com/', result => {
            cancelToken.throwIfCanceled();

            // get the response
            console.log(`Response from randomizer: ${JSON.stringify(result)}`);
            const cards = result.cards.supply.concat(
                result.cards.events,
                result.cards.landmarks,
                result.cards.projects,
                result.cards.ways)
                .filter(c => c !== '');

            // the card names we get back from the randomizer are normalized
            // map them back to their original names
            const originalCardNames = getOriginalCardNames(cards);

            // make the selections
            setButton('Colonies', getButtonLabel(result.cards.colonies));
            setButton('Shelters', getButtonLabel(result.cards.shelters));
            selectCards(originalCardNames, cancelToken, callback);
        });
    }

    function clearCards() {
        // clear the supply and the colonies/shelters
        $('.clear-kingdom').click();
        // delete the landscape cards
        $('.selection-symbol').click()
    }
    
    function getOriginalCardNames(normalizedCardNames) {
        return normalizedCardNames.map(getOriginalCardName).filter(c => c !== undefined);
    }

    let cachedCardNames;
    function getOriginalCardName(normalizedCardName) {
        if (cachedCardNames === undefined) {
            cachedCardNames = getCardNames();
        }
        const result = cachedCardNames.get(normalizedCardName);
        if (result === undefined) {
            console.error(`Could not find card with name ${normalizedCardName}`);
        }
        return result;
    }

    function getCardNames() {
        const splitCardNames = getSplitCardNames();
        const cardNames = new Map()
        for (let card in CardNames) {
            const cardName = CardNames[card].name;
            const localizedCard = LANGUAGE.getCardName[cardName];
            if (localizedCard !== undefined) {
                const splitCardName = splitCardNames.get(cardName);
                const finalCardName = splitCardName !== undefined ?
                    splitCardName :
                    cardName;
                const normalized = getNormalizedName(finalCardName);
                cardNames.set(normalized, localizedCard.singular);
            }
        }
        return cardNames;
    }

    // these cards don't normalize well, so convert them manually
    function getSplitCardNames() {
        return new Map([
            ['Encampment', 'Encampment/Plunder'],
            ['Patrician', 'Patrician/Emporium'],
            ['Settlers', 'Settlers/Bustling Village'],
            ['Catapult', 'Catapult/Rocks'],
            ['Gladiator', 'Gladiator/Fortune'],
            ['Sauna', 'Sauna/Avanto'],
        ]);
    }

    function getNormalizedName(cardName) {
        // remove spaces, quotes, and slashes
        return cardName
            .toLowerCase()
            .replace(/[ '/]/g, '');
    }

    function getButtonLabel(bool) {
        return bool ? 'Yes' : 'No';
    }

    function setButton(name, val) {
        const $btn = $(`three-valued-button[label="${name}: "] button`);

        // dominion.games has a bug where calling "Clear Selection" resets the state of the buttons,
        // but they appear to not change. So we first click the button to force a re-render.
        $btn.click();

        const current = getButtonValue($btn, name);
        let state = convertButtonState(current);
        const desired = convertButtonState(val);
        if (desired === -1 || state === -1) {
            console.error(`Can't set button '${name}' from '${current}' to '${val}'`);
            return;
        }
        if (desired === state) {
            console.log(`Button '${name}' is already on '${val}'`);
            return;
        }
        while (state !== desired) {
            console.log(`Clicking button '${name}'`);
            $btn.click();
            state += 1;
            state %= 3;
        }
    }

    function getButtonValue($btn, name) {
        return $btn.text().trim().substring(name.length+3);
    }

    function convertButtonState(state) {
        return ['Random', 'No', 'Yes'].findIndex(x => x === state);
    }

    function selectCards(cardNames, cancelToken, callback) {
        cancelToken.throwIfCanceled();
        const head = cardNames[0];
        const tail = cardNames.slice(1);
        const finalCallback = tail.length > 0 ? 
            () => setTimeout(() => selectCards(tail, cancelToken, callback), 100) :
            callback;
        selectCard(head, cancelToken, finalCallback);
    }

    function selectCard(cardName, cancelToken, callback) {
        // search the card name
        const $searchBar = $('.kingdom-choices input[type=search]');
        $searchBar.val(cardName).triggerAngular('change').triggerAngular('focus');

        // wait for results to load
        setTimeout(() => {
            cancelToken.throwIfCanceled();

            // surround cardName with two spaces on either side
            // this will uniquely identify the card
            const $choices = $(`.md-autocomplete-suggestions li:contains("  ${cardName}  ")`);

            // select the card, or log the failure
            if ($choices.length === 0) {
                console.log(`Card '${cardName}' not found or is already added`);
                const clearSearchButton = $('md-autocomplete-wrap button');
                clearSearchButton.click()
            }
            else {
                $choices.first().click();
            }

            if (callback !== undefined) {
                callback();
            }
        }, 100);
    }

    // test helper, just for getting to the new table page easily
    function navigate() {
        $.onExists('.lobby-page', () => {
            // create a table
            $.onExists('button:contains("New Table")', myTable => {
                $(myTable).click();
                // set 6 player minimum to avoid people joining
                $('.rule-number-selectors option[label="6"]').prop('selected', true)
                angular.element($('.rule-number-selectors select')[0]).triggerHandler('change');
                $.onExists('button:contains("Create Table")', createTable => {
                    $(createTable).click();
                    setTimeout(() => {
                        // select cards
                        $.onExists('button:contains("Select Kingdom Cards")', selectKingdom => {
                            $(selectKingdom).click();
                        }, { once: true });
                    }, 500);
                }, { once: true });
            }, { once: true });
        }, { once: true });
    }

    /* jQuery extensions */

    (function($){

        $.onExists = function(selector, callback, options = {}) {
            $(document).onExists(selector, callback, options);
        };

        $.fn.onExists = function(selector, callback, options = {}) {
            monkeymaster.onExists(selector, callback, {
                target: this[0],
                delayMs: options.delayMs,
                once: options.once,
            });
        };

        // angular DOM elements are too fancy to listen to regular triggers
        $.fn.triggerAngular = function(eventType) {
            angular.element(this).triggerHandler(eventType);
            return this;
        };
    })(jQuery);
})();
