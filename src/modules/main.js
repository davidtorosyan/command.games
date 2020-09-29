// ==Module==
// @name         main
// @namespace    https://github.com/davidtorosyan/command.games
// @author       David Torosyan
// ==/Module==

(function() {
    'use strict';

    /* dominion.games */

    if (window.location.host.indexOf(command.common.hostDomain) === -1) {
        return;
    }

    $(document).ready(function() {
        command.style.setup();
        command.random.setup();
        command.export.setup();
        command.background.setup();

        if (command.common.DEVELOPER_MODE) {
            if (command.common.SHOW_OPTIONS) {
                command.background.navigate();
            }
            else {
                command.random.navigate();
            }
        }
    });
})();