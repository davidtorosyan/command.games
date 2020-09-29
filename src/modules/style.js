// ==Module==
// @name         style
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

command.style = {};

(function() {
    'use strict';

    // rename the object to lib to allow easy renaming
    const lib = command.style;

    function setup() {
        if (command.common.DEVELOPER_MODE && command.common.SHOW_IFRAME) {
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
    lib.setup = setup;
})();