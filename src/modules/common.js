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

    // setup the helper library
    const console = monkeymaster.setupConsole('command.games');
    console.log('Loaded');
    monkeymaster.setupJobs('command.games');

    if (lib.DEVELOPER_MODE) {
        console.log('Running in developer mode');
        utmSource += '.dev';
    }

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

    function getButtonValue($btn) {
        return $btn.text().split(':')[1].trim();
    }
    lib.getButtonValue = getButtonValue;

    function getButtonLabel(bool) {
        const field = bool ? TernaryField.YES : TernaryField.NO;
        return LANGUAGE.getTernaryFieldTexts[field];
    }
    lib.getButtonLabel = getButtonLabel;

    function convertButtonState(state) {
        return [
            LANGUAGE.getTernaryFieldTexts[TernaryField.NO],
            LANGUAGE.getTernaryFieldTexts[TernaryField.YES],
            LANGUAGE.getTernaryFieldTexts[TernaryField.RANDOM],
        ].findIndex(x => x === state);
    }
    lib.convertButtonState = convertButtonState;

    function buttonWithName(name) {
        return $(`three-valued-button[label="${name}"] button`);
    }
    lib.buttonWithName = buttonWithName;

    function getButtonState(name) {
        return convertButtonState(getButtonValue(buttonWithName(name)));
    }
    lib.getButtonState = getButtonState;

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