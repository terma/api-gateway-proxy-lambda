# API Gateway Proxy Lambda

[![Build Status](https://travis-ci.org/terma/api-gateway-proxy-lambda.svg?branch=master)](https://travis-ci.org/terma/api-gateway-proxy-lambda)

Purpose: lambda to proxy incoming calls to defined host

## How to use

* Create lambda ```index.js```
* Setup API Gateway resource with ```ANY``` method
  * Enable proxy mode
  