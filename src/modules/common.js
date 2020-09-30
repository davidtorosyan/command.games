// ==Module==
// @name         common
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

const command = {};
command.common = {};

(function() {
    'use strict';

    // rename the object to lib to allow easy renaming
    const lib = command.common;

    /* boostrap */

    // constants
    lib.hostDomain = 'dominion.games';
    lib.randomizerDomain = 'dominionrandomizer.com';
    lib.randomizerUrl = `https://${lib.randomizerDomain}/`;

    // for tracking
    let utmSource = 'command.games';

    // automatically navigates to the kingdom card selection page
    lib.DEVELOPER_MODE = window.DEVELOPER_MODE;

    // dev options
    lib.SHOW_IFRAME = false;
    lib.SHOW_OPTIONS = false;

    // logging
    const console = monkeymaster.setupConsole('command.common');
    console.debug('Loaded');

    // setup the helper library
    monkeymaster.setupJobs('command.games');

    if (lib.DEVELOPER_MODE) {
        console.log('Running in developer mode');
        utmSource += '.dev';
    }

    /* i18n */

    const phrases = {
        CLEAR: 'Clear',
    };
    lib.Phrases = phrases;

    function getLanguages() {
        return new Map([
            [ENGLISH.getName(), new Map([
                [phrases.CLEAR, 'Clear'],
            ])],
            [RUSSIAN.getName(), new Map([
                [phrases.CLEAR, undefined], // need short form of 'Сбросить выделение'
            ])],
            [GERMAN.getName(), new Map([
                [phrases.CLEAR, undefined], // need short form of 'Auswahl entfernen'
            ])],
            [FRENCH.getName(), new Map([
                [phrases.CLEAR, undefined], // need short form of 'Effacer la sélection'
            ])],
            [JAPANESE.getName(), new Map([
                // none
            ])],
            [TCHINESE.getName(), new Map([
                [phrases.CLEAR, undefined], // need short form of '清除已選擇的卡片'
            ])],
            [DUTCH.getName(), new Map([
                // none
            ])],
        ])
    };

    let languages;
    function getLocalized(phrase) {
        languages = languages === undefined ? getLanguages() : languages;
        const language = languages.get(LANGUAGE.getName());
        return language.get(phrase);
    }
    lib.getLocalized = getLocalized;

    /* tracking helpers */

    function setTrackingParams(url, medium) {
        let retval = url;
        retval = monkeymaster.setQueryParam(retval, 'utm_source', utmSource);
        retval = monkeymaster.setQueryParam(retval, 'utm_medium', medium);
        retval = monkeymaster.setQueryParam(retval, 'utm_term', `v${GM_info.script.version}`);
        return retval;
    }
    lib.setTrackingParams = setTrackingParams;

    function removeTrackingParams() {
        monkeymaster.setWindowQueryParam('utm_source');
        monkeymaster.setWindowQueryParam('utm_medium');
        monkeymaster.setWindowQueryParam('utm_term');
    }
    lib.removeTrackingParams = removeTrackingParams;

    /* button helpers */

    function getButton(name) {
        const $btn = $(`three-valued-button[label="${name}"] button`);
        const button = {};

        const valueToTernaryMap = new Map([
            [LANGUAGE.getTernaryFieldTexts[TernaryField.NO], TernaryField.NO],
            [LANGUAGE.getTernaryFieldTexts[TernaryField.YES], TernaryField.YES],
            [LANGUAGE.getTernaryFieldTexts[TernaryField.RANDOM], TernaryField.RANDOM],
        ]);

        const ternaryToBitMap = new Map([
            [TernaryField.NO, 0],
            [TernaryField.YES, 1],
        ]);

        const boolToTernaryMap = new Map([
            [false, TernaryField.NO],
            [true, TernaryField.YES],
        ]);

        const ternaryOrder = [
            TernaryField.NO,
            TernaryField.YES,
            TernaryField.RANDOM,
        ];

        function getValue() {
            return $btn.text().split(':')[1].trim();
        }

        function getTernary() {
            return valueToTernaryMap.get(getValue());
        }

        function getBit() {
            return ternaryToBitMap.get(getTernary());
        }
        button.getBit = getBit;

        function setBool(bool) {
            // dominion.games has a bug where calling "Clear Selection" resets the state of the buttons,
            // but they appear to not change. So we first click the button to force a re-render.
            $btn.click();

            const desiredTernary = boolToTernaryMap.get(bool);
            const desiredTernaryName = LANGUAGE.getTernaryFieldTexts[desiredTernary];

            const currentTernary = getTernary();
            
            const desiredIndex = ternaryOrder.indexOf(desiredTernary);
            const currentIndex = ternaryOrder.indexOf(currentTernary);

            let clicksNeeded = desiredIndex - currentIndex;
            if (clicksNeeded < 0) {
                clicksNeeded += 3;
            }

            if (clicksNeeded === 0) {
                console.debug(`Button '${name}' is already on '${desiredTernaryName}'`);
            }
            else {
                for (let i = 0; i < clicksNeeded; i++) {
                    $btn.click();
                }
                console.debug(`Clicked button '${name}' ${clicksNeeded} times to get to '${desiredTernaryName}'`);
            }
        }
        button.setBool = setBool;

        return button;
    }
    lib.getButton = getButton;

    /* card name helpers */

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
    lib.getNormalizedName = getNormalizedName;

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