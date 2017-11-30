# API Gateway Proxy Lambda

[![Build Status](https://travis-ci.org/terma/api-gateway-proxy-lambda.svg?branch=master)](https://travis-ci.org/terma/api-gateway-proxy-lambda)

Purpose: lambda to proxy incoming calls to defined host

## How to use

* Create lambda ```index.js```
* Setup API Gateway resource with ```ANY``` method
  * Enable proxy mode
  
## Releases

- 0.1.0 support ```process.env.PATH_PREFIX```
- 0.0.1 initial release  
  