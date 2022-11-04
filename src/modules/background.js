// ==Module==
// @name         background
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

command.background = {};

(function() {
    'use strict';

    // rename the object to lib to allow easy renaming
    const lib = command.background;

    // logging
    const console = monkeymaster.setupConsole('command.background');
    console.debug('Loaded');

    function setup() {
        $.onExists('div.user-pref-scroll-container', () => {
            console.debug('Found preferences');

            const tooltipId = 'background-tooltip';
            if ($(`#${tooltipId}`).length) {
                console.debug('Already set up, skipping background creation.');
                return;
            }

            const $label = $(`label:contains("${LANGUAGE.getUserPreferences[UserPrefIds.PREFERRED_BACKGROUND]}")`);
            const $pref = $label.parent();
            const $input = $pref.find('input');

            const $img = $('<img src="" width="400px"></img>');
            const $text = $('<span class="tooltiptext" style="left:50%; top: initial; bottom:100%; width:auto; font-size: 1.2vw;"></span>');
            const $tooltip = $(`<div class="table-tooltip hidden" id=${tooltipId}></div>`);
            $text.append($img);
            $tooltip.append($text);

            $tooltip.insertAfter($label);

            $input.parent()
                .mouseover(() => $tooltip.show())
                .mouseleave(() => $tooltip.hide())

            const setImage = setImageFunc($input, $img);
            $input.parent().on('click', setImage)
            setImage();
        });
    }
    lib.setup = setup;

    // test helper, just for getting to the options page easily
    function navigate() {
        $.onExists('.lobby-page', () => {
            // create a table
            $.onExists(`button:contains("${LANGUAGE.getTabLabels[LobbyTabs.OPTIONS]}")`, options => {
                $(options).click();
            }, { once: true, delayMs: 100 });
        }, { once: true });
    }
    lib.navigate = navigate;

    function setImageFunc($input, $img) {
        return () => {
            const chosen = parseInt($input.val());
            if (chosen === undefined || isNaN(chosen)) {
                console.debug('Unable to parse chosen image')
            }
            else if (chosen === 0) {
                console.debug(`Chosen image is 0, hiding.`)
                $img.prop('style', 'visibility: hidden;');
            }
            else {
                const name = imageList[chosen-1];
                console.debug(`Chosen image: ${chosen}, which is ${name}`)
                $img.prop('style', '');
                $img.prop('src', `images/large/${name}`);
            }
        };
    }

    // ideally this should come directly from the page's javascript,
    // but it's not easily accessible
    const imageList = [
        'swamp-hag.jpg', 
        'inheritance.jpg',
        'haunted-woods.jpg',
        'dungeon.jpg',
        'rebuild.jpg',
        'adventures.jpg',
        'hinterlands.jpg',
        'feodum.jpg',
        'base.jpg',
        'dark-wood.jpg',
    ];

})();