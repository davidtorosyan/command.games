// ==Module==
// @name         export
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

command.export = {};

(function() {
    'use strict';

    // rename the object to lib to allow easy renaming
    const lib = command.export;

    function setup() {
        // every time the user navigates to the "choose cards" page,
        $.onExists('.kingdom-choices', $choices => {
            console.debug('Found kingdom choices');

            const exportId = 'export-button';
            if ($(`#${exportId}`).length) {
                console.debug('Already set up, skipping export button creation.');
                return;
            }

            // add an 'Export' button
            const exportText = '◯⇗'
            const exportStyle = 'font-size:1.2vw; letter-spacing: -1em; padding:.8vh 2.1vw .8vh .8vw; position: absolute; transform: translateY(-150%)'
            const $export = $(`<input type="button" id="${exportId}" class="lobby-button export-kingdom" style="${exportStyle}" value="${exportText}"></input>`);
            $export.on('click', openExport);
            $export.prependTo($choices);
        });
    }
    lib.setup = setup;

    function openExport() {
        const supply = getSelectedCards($('.selected-card .mini-card-art'));
        const landscapes = getSelectedLandscapesWithType($('.selected-cards .landscape-art'));
        const colonies = command.common.getButtonState(LANGUAGE.getLobbyButtons.SELECT_COLONIES);
        const shelters = command.common.getButtonState(LANGUAGE.getLobbyButtons.SELECT_SHELTERS);
        const url = command.common.setTrackingParams(getExportUrl(command.common.randomizerUrl, supply, landscapes, colonies, shelters), 'export');
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
            const normalized = command.common.getNormalizedName(card.name);
            const type = card.types[0];
            const typeName = type !== undefined ? type.name : undefined;
            cardUrls.set(url, [normalized, typeName]);
        }
        return cardUrls;
    }
})();