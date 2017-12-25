'use strict';

const nock = require('nock');
const assert = require('assert');

process.env.TARGET_DOMAIN = 'test.com';

const proxy = require('./index');

beforeEach(function () {
    delete process.env.CORS;
    delete process.env.HTTPS;
    delete process.env.PATH_PREFIX;
    delete process.env.EXCLUDE_PATH_PREFIX;
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
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    function assert200(event, a, done) {
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            a.done();
            done();
        });
    }

    describe('CORS', function () {
        it('should not add by default', function (done) {
            const event = {};
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
            proxy.handler(event, null, function (ignore, response) {
                assert.equal(200, response.statusCode);
                assert.equal(void 0, response.headers);
                a.done();
                done();
            });
        });

        it('should add CORS header to response if configured', function (done) {
            const event = {};
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
            process.env.CORS = true;
            proxy.handler(event, null, function (ignore, response) {
                assert.equal(200, response.statusCode);
                assert.equal('*', response.headers['Access-Control-Allow-Origin']);
                a.done();
                done();
            });
        });
    });

    describe('exclude path prefix', function () {
        it('should proxy as is by default', function (done) {
            const event = {requestContext: {path: '/Beta/test'}};
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/Beta/test').reply(200, 'xxx');
            assert200(event, a, done);
        });

        it('should proxy exclude prefix', function (done) {
            const event = {requestContext: {path: '/Beta/test'}};
            process.env.EXCLUDE_PATH_PREFIX = '/Beta';
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/test').reply(200, 'xxx');
            assert200(event, a, done);
        });

        // https://github.com/terma/api-gateway-proxy-lambda/issues/1
        it('should use resourcePath if path not defined', function (done) {
            const event = {requestContext: {resourcePath: '/Beta/test'}};
            process.env.EXCLUDE_PATH_PREFIX = '/Beta';
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/test').reply(200, 'xxx');
            assert200(event, a, done);
        });

        it('should proxy and don\'t exclude if not match', function (done) {
            const event = {requestContext: {path: '/Alpha/test'}};
            process.env.EXCLUDE_PATH_PREFIX = '/Beta';
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/Alpha/test').reply(200, 'xxx');
            assert200(event, a, done);
        });
    });

    describe('protocol', function () {
        it('should proxy as HTTP by default', function (done) {
            const event = {};
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
            assert200(event, a, done);
        });

        it('should proxy as HTTPS if configured', function (done) {
            const event = {};
            const a = nock('https://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
            process.env.HTTPS = true;
            assert200(event, a, done);
        });
    });

    describe('method', function () {
        it('should proxy method as is', function (done) {
            const event = {httpMethod: 'post', body: ''};
            const a = nock('http://' + process.env.TARGET_DOMAIN).post('/', '').reply(200, 'xxx');
            assert200(event, a, done);
        });

        it('should proxy get method if it not defined', function (done) {
            const event = {};
            const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
            assert200(event, a, done);
        });
    });

    it('should proxy and get back responseStatus', function (done) {
        const event = {};
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(500, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(500, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should proxy with minimum event info', function (done) {
        const event = {};
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/').reply(200, 'xxx');
        assert200(event, a, done);
    });

    it('should proxy with path', function (done) {
        const event = {
            requestContext: {
                path: '/special/path'
            }
        };
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/special/path').reply(200, 'xxx');
        proxy.handler(event, null, function (ignore, response) {
            assert.equal(200, response.statusCode);
            assert.equal('xxx', response.body);
            a.done();
            done();
        });
    });

    it('should add path prefix if configured', function (done) {
        const event = {requestContext: {path: '/special/path'}};
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/myPrefix/a/special/path').reply(200, 'xxx');
        process.env.PATH_PREFIX = '/myPrefix/a';
        assert200(event, a, done);
    });

    it('should add path prefix if configured for root path too', function (done) {
        const event = {requestContext: {path: '/'}};
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/myPrefix/').reply(200, 'xxx');
        process.env.PATH_PREFIX = '/myPrefix';
        assert200(event, a, done);
    });

    it('should proxy with query parameters', function (done) {
        const event = {
            queryStringParameters: {
                parameter2: '12',
                parameter1: 'value1'
            }
        };
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/?parameter2=12&parameter1=value1').reply(200, 'xxx');
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
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/', 'body text').reply(200, 'xxx');
        assert200(event, a, done);
    });

    it('should proxy with json body', function (done) {
        const event = {
            body: {message: 42}
        };
        const a = nock('http://' + process.env.TARGET_DOMAIN).get('/', {message: 42}).reply(200, 'xxx');
        assert200(event, a, done);
    });

});