'use strict';

const https = require('https');
const http = require('http');

const targetDomain = process.env.TARGET_DOMAIN;
const targetPort = process.env.TARGET_PORT;

if (!targetDomain) throw new Error('Set env TARGET_DOMAIN property to define proxy target!');

function log(message) {
    if (process.env.DEBUG || false) {
        if (!message || message.substr) console.log(message);
        else console.log(JSON.stringify(message));
    }
}

exports.handler = function (event, context, callback) {
    log('Event:');
    log(event);

    if (!event) {
        callback(null, {
            statusCode: 500,
            body: 'Invalid configuration. Event is null!'
        });
        return;
    }

    // setup request options and parameters
    const options = {hostname: targetDomain};
    if (event.httpMethod) options.method = event.httpMethod;
    if (targetPort) options.port = targetPort;

    // copy headers
    options.headers = event.headers;

    if (event.requestContext && event.requestContext.path) options.path = event.requestContext.path;
    else if (event.requestContext && event.requestContext.resourcePath) options.path = event.requestContext.resourcePath;
    else options.path = '/';

    if (process.env.EXCLUDE_PATH_PREFIX && options.path.indexOf(process.env.EXCLUDE_PATH_PREFIX) === 0)
        options.path = options.path.substr(process.env.EXCLUDE_PATH_PREFIX.length);

    if (process.env.PATH_PREFIX) options.path = process.env.PATH_PREFIX + options.path;

    // add query string parameters
    if (event.queryStringParameters) {
        const queryString = generateQueryString(event.queryStringParameters);
        if (queryString !== '') {
            options.path += '?' + queryString;
        }
    }

    // Define my callback to read the response and generate a JSON output for API Gateway.
    // The JSON output is parsed by the mapping templates
    const proxyCallback = function (proxyResponse) {
        let responseString = '';

        // Another chunk of data has been recieved, so append it to `str`
        proxyResponse.on('data', function (chunk) {
            responseString += chunk;
        });

        // The whole response has been received
        proxyResponse.on('end', function () {
            const response = {
                statusCode: proxyResponse.statusCode,
                body: responseString
            };
            if (process.env.CORS) response.headers = {'Access-Control-Allow-Origin': '*'};
            callback(null, response);
        });
    };

    log('Target request:');
    log(options);

    const connection = process.env.HTTPS ? https : http;
    const request = connection.request(options, proxyCallback);

    if (event.body && event.body !== "") {
        if (event.body.substr) request.write(event.body);
        else request.write(JSON.stringify(event.body));
    }

    request.on('error', function (e) {
        log('problem with request: ' + e.message);
        context.fail(JSON.stringify({
            status: 500,
            bodyJson: e.message
        }));
    });

    request.end();
};

function generateQueryString(params) {
    const str = [];
    for (const p in params) {
        if (params.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
        }
    }
    return str.join('&');
}