// ==UserScript==
// @name         command.games
// @namespace    https://github.com/davidtorosyan/command.games
// @version      1.8.0
// @description  improve dominion.games
// @author       David Torosyan
// @match        https://dominion.games/*
// @match        https://dominionrandomizer.com/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://github.com/davidtorosyan/command.games/raw/monkeymaster-v2.0.0/src/monkeymaster/monkeymaster.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/common.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/style.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/background.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/random.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/export.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/kingdom.js
// @require      https://github.com/davidtorosyan/command.games/raw/v1.8.0/src/modules/main.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_info
// ==/UserScript==

/*
    This file handles TamperMonkey setup, the actual code is imported above.

    Note the files listed with @require directives, and follow these rules:
    1. All files under the modules directory must be included.
    2. The first three files must be jQuery, monkeymaster, and common (in that order).
    3. The last file must be main.
*/