// ==Module==
// @name         random
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

command.random = {};

(function() {
    'use strict';

    // logging
    const console = monkeymaster.setupConsole('command.random');
    console.debug('Loaded');
    
    // rename the object to lib to allow easy renaming
    const lib = command.random;

    function setup() {
        // every time the user navigates to the "choose cards" page,
        $.onExists('.kingdom-choices', () => {
            console.debug('Found kingdom choices');

            const tooltipId = 'random-tooltip';
            if ($(`#${tooltipId}`).length) {
                console.debug('Already set up, skipping random button creation.');
                return;
            }

            const $clearButton = $('.clear-kingdom');
            const clearText = command.common.getLocalized(command.common.Phrases.CLEAR);
            if (clearText !== undefined) {
                $clearButton.val(clearText);
            }

            // add a 'Random' button
            const $randomize = $(`<input type="button" class="lobby-button random-kingdom" style="font-size:1.2vw;" value="${LANGUAGE.getPhrase[Phrases.RANDOM]}"></input>`);
            $randomize.on('click', tryRandomize);

            const url = command.common.setTrackingParams(command.common.randomizerUrl, 'link');
            const version = `v${GM_info.script.version}`;
            const tooltipText = `${LANGUAGE.getTabLabels[LobbyTabs.OPTIONS]}:<br> <a target="_blank" href="${url}">Dominion Randomizer</a>`;
            const smallText = `command.games <a target="_blank" href="https://github.com/davidtorosyan/command.games">${version}</a>`;
            const $tooltip = $(`<div class="tooltip" id="${tooltipId}"><span class="tooltiptext" style="left:-50%; top: initial; bottom:100%; width:200%; font-size: 1.0vw;">${tooltipText}<br><br><span style="font-size: .7vw;">${smallText}</span></span></div>`);
            $tooltip.append($randomize);
            $tooltip.insertAfter($clearButton);
        });
    }
    lib.setup = setup;

    // test helper, just for getting to the new table page easily
    function navigate() {
        $.onExists('.lobby-page', () => {
            // create a table
            $.onExists(`button:contains("${LANGUAGE.getLobbyButtons.NEW_TABLE}")`, newTable => {
                $(newTable).click();
                // set 6 player minimum to avoid people joining
                $('.rule-number-selectors option[label="6"]').prop('selected', true)
                angular.element($('.rule-number-selectors select')[0]).triggerHandler('change');
                $.onExists(`button:contains("${LANGUAGE.getPhrase[Phrases.CREATE_TABLE]}")`, createTable => {
                    $(createTable).click();
                    setTimeout(() => {
                        // select cards
                        $.onExists(`button:contains("${LANGUAGE.getLobbyButtons.SELECT_KINGDOM}")`, selectKingdom => {
                            $(selectKingdom).click();
                        }, { once: true });
                    }, 500);
                }, { once: true });
            }, { once: true });
        }, { once: true });
    }
    lib.navigate = navigate;
    
    // run randomization, making sure that running processes are canceled
    let randomizerCancelTokenSource;
    function tryRandomize() {
        if (randomizerCancelTokenSource !== undefined) {
            randomizerCancelTokenSource.cancel();
        }

        randomizerCancelTokenSource = monkeymaster.cancelTokenSource();
        const $randomButton = $('.random-kingdom');
        $randomButton.val(LANGUAGE.getTableStatus[TableStati.RUNNING]);

        randomize(randomizerCancelTokenSource.getToken(), () => {
            $randomButton.val(LANGUAGE.getPhrase[Phrases.RANDOM]);
        });
    }

    // randomize! see executeJob at the top of the script for how we get data from the other site.
    function randomize(cancelToken, callback) {
        console.log('Random!');

        let url;
        const isPartial = isPartialKingdom();
        if (isPartial) {
            url = command.export.getSelectedKingdomUrl();
            console.log(`Detected partial kingdom, randomizing from starting point: ${url}`);
        }
        else {
            url = command.common.randomizerUrl;
        }
        
        url = command.common.setTrackingParams(url, 'button');
        runRandomizer(cancelToken, callback, url, isPartial, true);
    }

    function runRandomizer(cancelToken, callback, url, isPartial, retryable) {
        monkeymaster.queueJob(url, getResultHandler(cancelToken, callback, isPartial), {
            completionCleanupDelayMs: 100, // give analytics a chance to fire
            cleanupDelayMs: command.common.DEVELOPER_MODE && command.common.SHOW_IFRAME ? -1 : undefined,
            failure: getFailureHandler(cancelToken, callback, url, isPartial, retryable),
        });
    }

    function getResultHandler(cancelToken, callback, isPartial) {
        return result => {
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

            // clear the current selection if we're starting with a full or empty kingdom
            if (!isPartial) {
                clearCards();
            }

            // make the selections
            command.common.getButton(LANGUAGE.getLobbyButtons.SELECT_COLONIES).setBool(result.cards.colonies);
            command.common.getButton(LANGUAGE.getLobbyButtons.SELECT_SHELTERS).setBool(result.cards.shelters);
            selectCards(originalCardNames, cancelToken);
            if (callback !== undefined) {
                callback();
            }
        }
    }

    function getFailureHandler(cancelToken, callback, url, isPartial, retryable) {
        return errorCode => {
            console.error(`Failed with errorcode: ${errorCode}`);
            if (errorCode === monkeymaster.errorCodes.RETRYABLE) {
                if (retryable) {
                    console.log('Retrying.');
                    runRandomizer(cancelToken, callback, url, isPartial, false);
                    return;
                }
                console.warn('Hit retry limit.');
            }
            callback();
        }
    }

    function isPartialKingdom() {
        // only consider the supply pile
        const selectedCardCount = $('.selected-card .mini-card-art').length;
        return selectedCardCount > 0 && selectedCardCount < 10;
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

    function getOriginalCardName(normalizedCardName) {
        const result = loadCardNames().get(normalizedCardName);
        if (result === undefined) {
            console.error(`Could not find card with name ${normalizedCardName}`);
        }
        return result;
    }

    let cachedCardNames;
    function loadCardNames() {
        if (cachedCardNames === undefined) {
            cachedCardNames = getCardNames();
        }
        return cachedCardNames;
    }

    function getCardNames() {
        const cardNames = new Map()
        for (let card in CardNames) {
            const cardName = CardNames[card].name;
            const localizedCard = LANGUAGE.getCardName[cardName];
            if (localizedCard !== undefined) {
                const normalized = command.common.getNormalizedName(cardName);
                cardNames.set(normalized, localizedCard.singular);
            }
        }
        return cardNames;
    }

    // function setButton(name, val) {
    //     const $btn = command.common.buttonWithName(name);

    //     // dominion.games has a bug where calling "Clear Selection" resets the state of the buttons,
    //     // but they appear to not change. So we first click the button to force a re-render.
    //     $btn.click();

    //     const current = command.common.getButtonValue($btn);
    //     let state = command.common.convertButtonState(current);
    //     const desired = command.common.convertButtonState(val);
    //     if (desired === -1 || state === -1) {
    //         console.error(`Can't set button '${name}' from '${current}' to '${val}'`);
    //         return;
    //     }
    //     if (desired === state) {
    //         console.debug(`Button '${name}' is already on '${val}'`);
    //         return;
    //     }
    //     while (state !== desired) {
    //         console.debug(`Clicking button '${name}'`);
    //         $btn.click();
    //         state += 1;
    //         state %= 3;
    //     }
    // }

    function selectCards(cardNames, cancelToken) {
        cancelToken.throwIfCanceled();
        const $searchBar = $('.kingdom-choices input[type=search]');
        $searchBar.val(cardNames).triggerAngular('change');
    }
})();