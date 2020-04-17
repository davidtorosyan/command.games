// ==LibraryScript==
// @name         monkeymaster
// @namespace    https://github.com/davidtorosyan/monkeymaster
// @version      1.0.0
// @description  common library for TamperMonkey
// @author       David Torosyan
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// ==/LibraryScript==

// once this library is mature, it can be moved out into its own repo
const monkeymaster = {};

(function() {
    'use strict';

    // rename the object to lib to allow easy renaming
    const lib = monkeymaster;

    /* Logging */

    // Overwrite console.log to have a prefix.
    // @param string prefix: the prefix to add before logs
    // @return object: clone of window.console with modified functions
    function setupConsole(prefix) {
        const customConsole = {};
        Object.assign(customConsole, window.console);

        const functionsToPrefix = ['log', 'error', 'debug', 'warn'];
        for (let name of functionsToPrefix) {
            customConsole[name] = function () {
                const args = [`[${prefix}]`];
                Array.prototype.push.apply(args, arguments)
                window.console[name].apply(window.console, args);
            };
        }

        return customConsole;
    }
    lib.setupConsole = setupConsole;

    const console = setupConsole('monkeymaster');
    console.log('Loaded');

    /* Query params */

    // Get the value of a query param.
    // @param string name: the name of the query param
    // @param bool remove: whether or not to remove the query param after reading it
    // @returns string: the value of the query param
    function getQueryParameter(name, remove) {
        var match = RegExp(`([?]|.*[&])${name}=([^&\n]*)&?(.*)`).exec(window.location.search);
        if (match) {
            if (remove) {
                var search = match[1] + match[3];
                var newPath = window.location.pathname + (search === '?' ? '' : search);
                window.history.replaceState(null, null, newPath);
            }
            return decodeURIComponent(match[2].replace(/\+/g, ' '));
        }
        return '';
    }
    lib.getQueryParameter = getQueryParameter;

    /* Cancellation */

    // Get a cancellation token source.
    // You can call getToken and pass that object to async functions.
    // They should frequently check token.isCanceled, or call token.throwIfCanceled.
    // @returns object: a cancellation token source
    function cancelTokenSource() {
        let canceled = false;
        return {
            cancel: () => canceled = true,
            getToken: () => ({
                isCanceled: canceled,
                throwIfCanceled: () => {
                    if (canceled) {
                        console.log('Canceled!');
                        throw 'Canceled!';
                    }
                }
            })
        };
    }
    lib.cancelTokenSource = cancelTokenSource;

    /* Jobs */

    /*
    // @require      https://code.jquery.com/jquery-3.4.1.min.js
    // @grant        GM_setValue
    // @grant        GM_getValue
    // @grant        GM_addValueChangeListener
    // @grant        GM_removeValueChangeListener
    */

    function formatJobUrl(url, jobId) { 
        // TODO Support existing query params in jobs module: https://github.com/davidtorosyan/command.games/issues/2
        return `${url}?jobId=${jobId}`;
    }

    function formatJobResultKey(jobId) { 
        return `${jobId}_result`;
    }

    function formatJobParamKey(jobId) { 
        return `${jobId}_param"`
    }

    function formatJobNamespaceKey(jobId) { 
        return `${jobId}_namespace"`
    }

    function setJobNamespace(jobId, namespace) { 
        GM_setValue(formatJobNamespaceKey(jobId), namespace);
    }

    function setJobParam(jobId, param) { 
        GM_setValue(formatJobParamKey(jobId), param);
    }

    function setJobResult(jobId, retval) {
        GM_setValue(formatJobResultKey(jobId), retval);
    }

    function getJobNamespace(jobId) {
        return GM_getValue(formatJobNamespaceKey(jobId));
    }

    function getJobParam(jobId) {
        return GM_getValue(formatJobParamKey(jobId));
    }

    function getJobResult(jobId) {
        return GM_getValue(formatJobResultKey(jobId));
    }

    function createJobResultListener(jobId, callback) {
        return GM_addValueChangeListener(formatJobResultKey(jobId), (name, _, new_value) => {
            console.log(`Completed job: ${jobId}`);
            callback(new_value);
        });
    }

    function createJobId() {
        const jobIdLength = 7;
        let text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        for (let i = 0; i < jobIdLength; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    function getJobContainer() {
        // TODO Remove dependency on jQuery from monkeymaster jobs module: https://github.com/davidtorosyan/command.games/issues/1
        const jobContainerId = 'job-container';
        let $jobContainer = $('#'+jobContainerId);
        if ($jobContainer.length === 0) {
            $jobContainer = $('<div>', {'id': jobContainerId, 'style': 'display: none;'});
            $('body').append($jobContainer);
        }
        return $jobContainer;
    }

    function secondsToMilliseconds(seconds) { 
        return seconds * 1000; 
    }

    function cleanupJob(listener_id, jobId) {
        console.debug(`Cleaning up job: ${jobId}`);
        GM_removeValueChangeListener(listener_id);
        $(`#${jobId}`).remove();
    }

    function testPermissions() {
        // TODO Test permissions in job module: https://github.com/davidtorosyan/command.games/issues/3
    }

    function assertSetup(namespace) {
        testPermissions();
        if (namespace === undefined) {
            const message = 'error: call setupJobs first, or pass in namespace in options';
            console.error(message);
            throw message;
        }
    }

    // default namespace to use for jobs
    let defaultJobNamespace;

    // Setup the jobs engine.
    // @param string namespace: a unique identifier for a type of job, name this after your script
    function setupJobs(namespace) {
        testPermissions();
        defaultJobNamespace = namespace;
    }
    lib.setupJobs = setupJobs;
    
    // Queue up a job for another page to execute.
    // Essentially enables cross-site scripting. See executeJob for the other half.
    // The other page must be listed as @match for a script that uses executeJob.
    // You must call setupJobs before this, unless you use the options.namespace parameter.
    // @param string url: the url to run the job, will be loaded in an iFrame
    // @param func callback: a function to execute when there are results
    // @param object options:
    //  object param: a parameter to pass to the job
    //  number cleanupDelayMs: how long to wait before cleaning the iFrame and listener, defaults to 15 seconds. Use -1 to skip cleanup.
    //  string namespace: the unique identifier for these jobs, not required if setupJobs is used
    function queueJob(url, callback, options = {}) {
        // setup
        const param = options.param;
        const cleanupDelayMs = options.cleanupDelayMs === undefined ? secondsToMilliseconds(15) : options.cleanupDelayMs;
        const namespace = options.namespace || defaultJobNamespace;
        assertSetup(namespace);

        // create job metadata and listener
        const jobId = createJobId();
        console.log(`Creating job: ${jobId}`);
        setJobNamespace(jobId, namespace);
        if (param !== undefined) {
            setJobParam(jobId, param);
        }
        const listener_id = createJobResultListener(jobId, callback);
        
        // add the iFrame
        // TODO Remove dependency on jQuery from monkeymaster jobs module: https://github.com/davidtorosyan/command.games/issues/1
        const $frame = $('<iframe>', { 
            'id': jobId, 
            'class': 'job', 
            'src': formatJobUrl(url, jobId) 
        });
        var $jobContainer = getJobContainer();
        $jobContainer.append($frame);

        // cleanup
        if (cleanupDelayMs !== -1) {
            setTimeout(() => cleanupJob(listener_id, jobId), cleanupDelayMs);
        }
    }
    lib.queueJob = queueJob;

    // Execute a job if one is found.
    // Essentially enables cross-site scripting. See queueJob for the other half.
    // You must call setupJobs before this, unless you use the options.namespace parameter.
    // The callback parameter is called with two arguments:
    //  param: an optional job parameter passed by queueJob
    //  callback: a func to call with the job result
    // @param func callback: a function to execute when a job is found
    // @param object options:
    //  string namespace: the unique identifier for these jobs, not required if setupJobs is used
    function executeJob(callback, options = {}) {
        // setup
        const namespace = options.namespace || defaultJobNamespace;
        assertSetup(namespace);

        // detect a job
        const jobId = getQueryParameter('jobId');
        if (!jobId) {
            console.log('No jobId found')
            return
        }
        const jobType = getJobNamespace(jobId);
        if (jobType !== namespace) {
            console.log(`Skipping job ${jobId} from '${jobType}', expected '${namespace}'`);
            return;
        }

        // execute
        console.log(`Executing job: ${jobId}`);
        const param = getJobParam(jobId);
        callback(param, result => {
            setJobResult(jobId, result);
        });
    }
    lib.executeJob = executeJob;

    /* DOM */

    /*
    // @require      https://code.jquery.com/jquery-3.4.1.min.js
    */

    // Add a listener to a DOM element that watches for added children.
    // If the selected child already exists when this function is called,
    // callback will still be triggered.
    // @param string selector: a selector for children to look for
    // @param func callback: a function to run when a children is added
    // @param object options:
    //  object target: the DOM node to watch, defaults to document
    //  bool direct: true to only include direct children
    //  bool once: true to only run once, and then remove the listener
    //  number delayMs: use this to run the callback in a timeout
    function onExists(selector, callback, options = {}) {
        // setup
        const target = options.target || document.documentElement;
        const subtree = !(options.direct === true);
        const once = options.once === true;
        const delayMs = options.delayMs;
        
        // the actual callback when a node is found
        const finalCallback = function(node) {
            if (delayMs === undefined) {
                callback(node);
            }
            else {
                setTimeout(() => callback(node), delayMs);
            }
        };

        // see if the node already exists
        const $node = $(target).find(selector);
        if ($node.length > 0) {
            console.debug(`Element with selector '${selector}' already exists.`)
            finalCallback($node[0]);
            if (once) {
                return;
            }
        }
        
        // Important note about MutationObserver:
        // It only triggers for added elements, not all their children.
        // So we need to check both the top level element, and all its children.
        const observer = new MutationObserver(function (mutations, obv) {
            for (let mutation of mutations) {
                for (let addedNode of mutation.addedNodes) {
                    let $addedNode = $(addedNode);
                    let result = undefined;
                    if ($addedNode.is(selector)) {
                        result = addedNode;
                    }
                    else if (subtree) {
                        const $searchResult = $addedNode.find(selector);
                        if ($searchResult.length > 0) {
                            result = $searchResult[0];
                        }
                    }
                    if (result !== undefined) {
                        if (once) {
                            obv.disconnect();
                        }
                        console.debug(`Element with selector '${selector}' added.`)
                        finalCallback(result);
                        if (once) {
                            return;
                        }
                    }
                }
            }
        });
        observer.observe(target, {
            childList: true,
            subtree: subtree
        });
    }
    lib.onExists = onExists;

})();