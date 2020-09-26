// ==UserScript==
// @name         command.games
// @namespace    https://github.com/davidtorosyan/command.games
// @version      1.6.0
// @description  improve dominion.games
// @author       David Torosyan
// @match        https://dominion.games/*
// @match        https://dominionrandomizer.com/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://github.com/davidtorosyan/command.games/raw/monkeymaster-v1.3.1/src/monkeymaster/monkeymaster.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_info
// ==/UserScript==

(function() {
    'use strict';

    // for tracking
    let utmSource = 'command.games';

    // automatically navigates to the kingdom card selection page
    const DEVELOPER_MODE = window.DEVELOPER_MODE;

    // dev options
    const SHOW_IFRAME = false;
    const SHOW_OPTIONS = false;

    // setup the helper library
    const console = monkeymaster.setupConsole('command.games');
    console.log('Loaded');
    monkeymaster.setupJobs('command.games');

    if (DEVELOPER_MODE) {
        console.log('Running in developer mode');
        utmSource += '.dev';
    }

    /* dominionrandomizer.com */

    const randomizerDomain = 'dominionrandomizer.com';

    // This section handles randomization.
    // It's expected to only run in an iFrame (see monkeymaster.executeJob).
    // Ideally shouldn't impact normal usage of dominionrandomizer.com
    if (window.location.host.indexOf(randomizerDomain) !== -1) {
        
        // run this callback when a job is found
        // tweak the settings, grab the card list, and return
        monkeymaster.executeJob((param, callback) => {
            $(document).ready(function() {
                ensureDeprecatedSetsAreUnchecked(() => {
                    callback(getCardList());
                });
            });
        }, {
            nojob: removeTrackingParams
        });

        function removeTrackingParams() {
            monkeymaster.setWindowQueryParam('utm_source');
            monkeymaster.setWindowQueryParam('utm_medium');
            monkeymaster.setWindowQueryParam('utm_term');
        }

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

        // important! return to avoid running the rest of the script
        return;
    }

    /* dominion.games */

    const randomizerUrl = `https://${randomizerDomain}/`;

    // main
    $(document).ready(function() {
        setupCSS();
        setupRandom();
        setupExport();
        setupBackground();
        if (DEVELOPER_MODE) {
            if (SHOW_OPTIONS) {
                navigateOptions();
            }
            else {
                navigateRandom();
            }
        }
    });

    function setupBackground() {
        $.onExists('div[ng-if="lobby.tab.userPrefTab"]', () => {
            console.debug('Found preferences');

            const tooltipId = 'background-tooltip';
            if ($(`#${tooltipId}`).length) {
                console.debug('Already set up, skipping background creation.');
                return;
            }

            const $label = $(`label:contains("${LANGUAGE.getUserPreferences[UserPrefIds.PREFERRED_BACKGROUND]}")`);
            const $pref = $label.next();
            const $input = $pref.find('input');

            const $img = $('<img src="swamp-hag.jpg" width="400px"></img>');
            const $text = $('<span class="tooltiptext" style="left:50%; top: initial; bottom:100%; width:auto; font-size: 1.2vw;"></span>');
            const $tooltip = $(`<div class="tooltip" id=${tooltipId} style="display:block"></div>`);
            $text.append($img);
            $tooltip.append($text);
            $tooltip.append($pref);
            $tooltip.insertAfter($label);

            function setImage() {
                // ideally this should come directly from the page's javascript,
                // but it's not easily accessible
                const imageList = ['swamp-hag.jpg', 'inheritance.jpg', 'haunted-woods.jpg', 'dungeon.jpg', 'rebuild.jpg', 'adventures.jpg', 'hinterlands.jpg', 'feodum.jpg', 'base.jpg', 'dark-wood.jpg'];
                const chosen = parseInt($input.val());
                if (chosen === 0) {
                    $img.prop('style', 'visibility: hidden;');
                }
                else {
                    const name = imageList[chosen-1];
                    $img.prop('style', '');
                    $img.prop('src', `images/large/${name}`);
                }
            }

            $input.on('change', setImage);
            setImage();
        });
    }

    function setupCSS() {
        if (DEVELOPER_MODE && SHOW_IFRAME) {
            $("<style>")
            .prop("type", "text/css")
            .html(`
                #${monkeymaster.jobContainerId} {
                    position: sticky;
                    z-index: 101;
                    display: block!important;
                    margin-top: 1500px;
                    width: 1600px;
                    height: 1000px;
                }
                iframe {
                    width: 1600px;
                    height: 1000px;
                }
                body, html {
                    overflow: scroll!important;
                    height: 3000px!important;
                }
            `)
            .appendTo("head");
        }
    }

    function setupRandom() {
        // every time the user navigates to the "choose cards" page,
        $.onExists('.kingdom-choices', () => {
            console.debug('Found kingdom choices');

            const tooltipId = 'random-tooltip';
            if ($(`#${tooltipId}`).length) {
                console.debug('Already set up, skipping button creation.');
                return;
            }

            // // rename the "Clear Selection" button to save room
            const $clearButton = $('.clear-kingdom');
            // $clearButton.val('Clear');

            // add a 'Random' button
            const $randomize = $(`<input type="button" class="lobby-button random-kingdom" style="font-size:1.2vw;" value="${LANGUAGE.getPhrase[Phrases.RANDOM]}"></input>`);
            $randomize.on('click', tryRandomize);

            const url = setTrackingParams(randomizerUrl, 'link');
            const version = `v${GM_info.script.version}`;
            const tooltipText = `${LANGUAGE.getTabLabels[LobbyTabs.OPTIONS]}:<br> <a target="_blank" href="${url}">Dominion Randomizer</a>`;
            const smallText = `command.games <a target="_blank" href="https://github.com/davidtorosyan/command.games">${version}</a>`;
            const $tooltip = $(`<div class="tooltip" id="${tooltipId}"><span class="tooltiptext" style="left:-50%; top: initial; bottom:100%; width:200%; font-size: 1.0vw;">${tooltipText}<br><br><span style="font-size: .7vw;">${smallText}</span></span></div>`);
            $tooltip.append($randomize);
            $tooltip.insertAfter($clearButton);
        });
    }

    function setupExport() {
        // every time the user navigates to the "choose cards" page,
        $.onExists('.kingdom-choices', $choices => {
            console.debug('Found kingdom choices');

            // add an 'Export' button
            const exportText = 'Export'
            const $export = $(`<input type="button" class="lobby-button export-kingdom" style="font-size:1.2vw;" value="${exportText}"></input>`);
            $export.on('click', openExport);
            $export.insertBefore($choices);
        });
    }

    function openExport() {
        const supply = getSelectedCards($('.selected-card .mini-card-art'));
        const landscapes = getSelectedLandscapesWithType($('.selected-cards .landscape-art'));
        const colonies = convertButtonState(getButtonValue(buttonWithName(LANGUAGE.getLobbyButtons.SELECT_COLONIES)));
        const shelters = convertButtonState(getButtonValue(buttonWithName(LANGUAGE.getLobbyButtons.SELECT_SHELTERS)));
        const url = setTrackingParams(getExportUrl(randomizerUrl, supply, landscapes, colonies, shelters), 'export');
        console.log(url);
        openLinkInNewTab(url);
    }

    function getSelectedCards($cards) {
        return $.map($cards, getUrlFromCard).map(getSelectedCard).filter(c => c !== undefined);
    }

    function getSelectedCard(url) {
        const result = loadCardUrls().get(url);
        if (result === undefined) {
            console.error(`Could not find card with url ${url}`);
        }
        return result[0];
    }

    function getSelectedLandscapesWithType($cards) {
        return $.map($cards, getUrlFromCard).map(getSelectedLandscapeWithType).filter(c => c !== undefined);
    }

    function getSelectedLandscapeWithType(url) {
        const result = loadCardUrls().get(url);
        if (result === undefined) {
            console.error(`Could not find card with url ${url}`);
        }
        return result;
    }

    function getUrlFromCard(card) {
        const style = $(card).attr('style');
        const url = style.substring(style.lastIndexOf('(')+1, style.lastIndexOf(')'));
        return url;
    }

    function getExportUrl(url, supply, landscapes, colonies, shelters) {
        let retval = url;
        retval = monkeymaster.setQueryParam(retval, 'supply', supply.join(','));

        const grouped = groupBy(landscapes, card => card[1]);
        console.log(grouped);
        for (let [landscapeType, cards] of grouped) {
            const normalizedLandscapeType = getNormalizedLandscapeType(landscapeType);
            retval = monkeymaster.setQueryParam(retval, normalizedLandscapeType, cards.join(','));
        }

        if (colonies != 2) {
            retval = monkeymaster.setQueryParam(retval, 'colonies', colonies);
        }
        
        if (shelters != 2) {
            retval = monkeymaster.setQueryParam(retval, 'shelters', shelters);
        }
        
        return retval;
    }

    function getNormalizedLandscapeType(landscapeType) {
        return landscapeType
            .toLowerCase()
            + 's';
    }

    function groupBy(list, keyGetter) {
        const map = new Map();
        list.forEach((item) => {
             const key = keyGetter(item);
             const collection = map.get(key);
             if (!collection) {
                 map.set(key, [item]);
             } else {
                 collection.push(item);
             }
        });
        return map;
    }    

    function openLinkInNewTab(url) {
        $('<a />',{'href': url, 'target': '_blank'}).get(0).click();
    }

    let cachedCardUrls;
    function loadCardUrls() {
        if (cachedCardUrls === undefined) {
            cachedCardUrls = getCardUrls();
        }
        return cachedCardUrls;
    }

    function getCardUrls() {
        const cardUrls = new Map()
        for (let cardName in CardNames) {
            const card = CardNames[cardName];
            const url = getFullArtURL(card);
            const normalized = getNormalizedName(card.name);
            const type = card.types[0];
            const typeName = type !== undefined ? type.name : undefined;
            cardUrls.set(url, [normalized, typeName]);
        }
        return cardUrls;
    }

    // run randomization, making sure that running processes are canceled
    let randomizerCancelTokenSource;
    function tryRandomize() {
        if (randomizerCancelTokenSource !== undefined) {
            randomizerCancelTokenSource.cancel();
        }
        randomizerCancelTokenSource = monkeymaster.cancelTokenSource();
        const $randomize = $('.random-kingdom');
        $randomize.val(LANGUAGE.getTableStatus[TableStati.RUNNING]);
        randomize(randomizerCancelTokenSource.getToken(), () => {
            $randomize.val(LANGUAGE.getPhrase[Phrases.RANDOM]);
        });
    }

    // randomize! see executeJob at the top of the script for how we get data from the other site.
    function randomize(cancelToken, callback) {
        console.log('Random!');
        clearCards();
        const url = setTrackingParams(randomizerUrl, 'button');
        monkeymaster.queueJob(url, result => {
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
            setButton(LANGUAGE.getLobbyButtons.SELECT_COLONIES, getButtonLabel(result.cards.colonies));
            setButton(LANGUAGE.getLobbyButtons.SELECT_SHELTERS, getButtonLabel(result.cards.shelters));
            selectCards(originalCardNames, cancelToken);
            if (callback !== undefined) {
                callback();
            }
        }, {
            completionCleanupDelayMs: 100, // give analytics a chance to fire
            skipCleanupOnCompletion: DEVELOPER_MODE && SHOW_IFRAME,
            cleanupDelayMs: DEVELOPER_MODE && SHOW_IFRAME ? -1 : undefined,
        });
    }

    function clearCards() {
        // clear the supply and the colonies/shelters
        $('.clear-kingdom').click();
        // delete the landscape cards
        $('.selection-symbol').click()
    }

    function setTrackingParams(url, medium) {
        let retval = url;
        retval = monkeymaster.setQueryParam(retval, 'utm_source', utmSource);
        retval = monkeymaster.setQueryParam(retval, 'utm_medium', medium);
        retval = monkeymaster.setQueryParam(retval, 'utm_term', `v${GM_info.script.version}`);
        return retval;
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
                const normalized = getNormalizedName(cardName);
                cardNames.set(normalized, localizedCard.singular);
            }
        }
        return cardNames;
    }

    const splitCardNames = new Map([
        ['Encampment', 'Encampment/Plunder'],
        ['Patrician', 'Patrician/Emporium'],
        ['Settlers', 'Settlers/Bustling Village'],
        ['Catapult', 'Catapult/Rocks'],
        ['Gladiator', 'Gladiator/Fortune'],
        ['Sauna', 'Sauna/Avanto'],
    ]);

    function getNormalizedName(cardName) {
        // some cards don't normalize well, so convert them first
        const splitCardName = splitCardNames.get(cardName);
        const finalCardName = splitCardName !== undefined ?
            splitCardName :
            cardName;

        // remove spaces, quotes, and slashes
        return finalCardName
            .toLowerCase()
            .replace(/[ '/]/g, '');
    }

    function getButtonLabel(bool) {
        const field = bool ? TernaryField.YES : TernaryField.NO;
        return LANGUAGE.getTernaryFieldTexts[field];
    }

    function buttonWithName(name) {
        return $(`three-valued-button[label="${name}"] button`);
    }

    function setButton(name, val) {
        const $btn = buttonWithName(name);

        // dominion.games has a bug where calling "Clear Selection" resets the state of the buttons,
        // but they appear to not change. So we first click the button to force a re-render.
        $btn.click();

        const current = getButtonValue($btn);
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

    function getButtonValue($btn) {
        return $btn.text().split(':')[1].trim();
    }

    function convertButtonState(state) {
        return [
            LANGUAGE.getTernaryFieldTexts[TernaryField.NO],
            LANGUAGE.getTernaryFieldTexts[TernaryField.YES],
            LANGUAGE.getTernaryFieldTexts[TernaryField.RANDOM],
        ].findIndex(x => x === state);
    }

    function selectCards(cardNames, cancelToken) {
        cancelToken.throwIfCanceled();
        const $searchBar = $('.kingdom-choices input[type=search]');
        $searchBar.val(cardNames).triggerAngular('change');
    }

    // test helper, just for getting to the options page easily
    function navigateOptions() {
        $.onExists('.lobby-page', () => {
            // create a table
            $.onExists(`button:contains("${LANGUAGE.getTabLabels[LobbyTabs.OPTIONS]}")`, options => {
                $(options).click();
            }, { once: true, delayMs: 100 });
        }, { once: true });
    }

    // test helper, just for getting to the new table page easily
    function navigateRandom() {
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
