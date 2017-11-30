'use strict';

const nock = require('nock');
const assert = require('assert');

process.env.TARGET_DOMAIN = 'test.com';

const proxy = require('./index');

beforeEach(function () {
    delete process.env.PATH_PREFIX;
});

describe('API Gateway Lambda Proxy', function () {
    it('should show error if event is null', function () {
        let response = void 0;
        proxy.handler(null, null, function (a, b) {
            response = b;
        });
        assert.equal(500, response.statusCode);
        assert.equal('Invalid configuration. Event is null!', response.body);
    });

    it('should proxy and get back body', function (done) {
        const event = {};
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should proxy and get back responseStatus', function (done) {
        const event = {};
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/').reply(500, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(500, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should proxy with minimum event info', function (done) {
        const event = {};
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    });

    it('should proxy with path', function (done) {
        const event = {
            requestContext: {
                path: '/special/path'
            }
        };
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/special/path').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should add path prefix if configured', function (done) {
        const event = {requestContext: {path: '/special/path'}};
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/myPrefix/a/special/path').reply(200, 'xxx');
        process.env.PATH_PREFIX = '/myPrefix/a';
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    });

    it('should add path prefix if configured for root path too', function (done) {
        const event = {requestContext: {path: '/'}};
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/myPrefix/').reply(200, 'xxx');
        process.env.PATH_PREFIX = '/myPrefix';
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    });

    it('should proxy with query parameters', function (done) {
        const event = {
            queryStringParameters: {
                parameter2: '12',
                parameter1: 'value1'
            }
        };
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/?parameter2=12&parameter1=value1').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should proxy with string body', function (done) {
        const event = {
            body: 'body text'
        };
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/', 'body text').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    });

    it('should proxy with json body', function (done) {
        const event = {
            body: {message: 42}
        };
        const a = nock('https://' + process.env.TARGET_DOMAIN).get('/', {message: 42}).reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    });

});