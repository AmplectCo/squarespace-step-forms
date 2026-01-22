(function() {
    'use strict';

    // Constants
    const READY_STATE_DONE = 4;
    const DEFAULT_METHOD = 'GET';
    const REQUEST_TYPE_XHR = 'xhr';
    const REQUEST_TYPE_FETCH = 'fetch';

    // Store original methods
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalFetch = window.fetch;

    /**
     * Unified event dispatcher for intercepted requests
     * @param {string} type - Request type ('xhr' or 'fetch')
     * @param {Object} data - Request/response data
     */
    function dispatchInterceptionEvent(type, data) {
        const eventName = type === REQUEST_TYPE_XHR ? 'xhrIntercepted' : 'fetchIntercepted';
        const eventData = {
            type,
            url: data.url || '',
            method: data.method || DEFAULT_METHOD,
            status: data.status || 0,
            statusText: data.statusText || '',
            timestamp: data.timestamp || Date.now(),
            ...data
        };

        document.dispatchEvent(new CustomEvent(eventName, {
            detail: eventData,
            bubbles: true
        }));

    }

    // Intercept XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._intercepted = {
            method,
            url,
            async,
            timestamp: Date.now()
        };
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;

        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === READY_STATE_DONE) {
                const eventData = {
                    url: xhr._intercepted?.url,
                    method: xhr._intercepted?.method,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseType: xhr.responseType,
                    response: xhr.response || xhr.responseText,
                    timestamp: xhr._intercepted?.timestamp
                };

                dispatchInterceptionEvent(REQUEST_TYPE_XHR, eventData);
            }
        });

        return originalXHRSend.apply(this, arguments);
    };

    // Intercept Fetch API
    window.fetch = function(...args) {
        const [url, options = {}] = args;
        const method = options.method || DEFAULT_METHOD;

        const promise = originalFetch.apply(this, args);

        return promise
            .then(response => {
                const eventData = {
                    url,
                    method,
                    status: response.status,
                    statusText: response.statusText,
                    timestamp: Date.now()
                };

                dispatchInterceptionEvent(REQUEST_TYPE_FETCH, eventData);
                return response;
            })
            .catch(error => {
                const eventData = {
                    url,
                    method,
                    status: 0,
                    statusText: '',
                    error: error.message,
                    timestamp: Date.now()
                };

                dispatchInterceptionEvent(REQUEST_TYPE_FETCH, eventData);
                throw error;
            });
    };
})();