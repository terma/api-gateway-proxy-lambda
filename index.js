'use strict';

const https = require('https');
// const https = require('https');

const targetDomain = process.env.TARGET_DOMAIN;
const targetPort = process.env.TARGET_PORT;
const debug = process.env.DEBUG;

if (!targetDomain) throw new Error('Set env TARGET_DOMAIN property to define proxy target!');

function log(message) {
    if (debug) console.log(message);
}

exports.handler = function(event, context, callback) {
    if (!event) {
        callback(null, {
            statusCode: 500,
            body: 'Invalid configuration. Event is null!'
        });
        return;
    }

    // setup request options and parameters
    const options = {hostname: targetDomain};
    if (targetPort) options.port = targetPort;

    // copy headers
    options.headers = event.headers;

    if (event.requestContext && event.requestContext.path) options.path = event.requestContext.path;
    else options.path = '/';

    if (process.env.PATH_PREFIX) options.path = process.env.PATH_PREFIX + options.path;

    // add query string parameters
    if (event.queryStringParameters) {
        var queryString = generateQueryString(event.queryStringParameters);
        if (queryString !== "") {
            options.path += "?" + queryString;
        }
    }

    // Define my callback to read the response and generate a JSON output for API Gateway.
    // The JSON output is parsed by the mapping templates
    const callback1 = function(response) {
        var responseString = '';

        // Another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            responseString += chunk;
        });

        // The whole response has been received
        response.on('end', function () {
            callback(null, {
                statusCode: response.statusCode,
                body: responseString
            });
        });
    };

    log('proxy: https://' + options.hostname + (options.port ? ':' + options.port : '') + options.path);

    const req = https.request(options, callback1);

    if (event.body && event.body !== "") {
        if (event.body.substr) req.write(event.body);
        else req.write(JSON.stringify(event.body));
    }

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        context.fail(JSON.stringify({
            status: 500,
            bodyJson: JSON.stringify({ message: "Internal server error" })
        }));
    });

    req.end();
};

function generateQueryString(params) {
    var str = [];
    for(var p in params) {
        if (params.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
        }
    }
    return str.join("&");
}