# API Gateway Proxy Lambda

[![Build Status](https://travis-ci.org/terma/api-gateway-proxy-lambda.svg?branch=master)](https://travis-ci.org/terma/api-gateway-proxy-lambda)
[![npm version](https://badge.fury.io/js/api-gateway-proxy-lambda.svg)](https://badge.fury.io/js/api-gateway-proxy-lambda)
[![Coverage Status](https://coveralls.io/repos/github/terma/api-gateway-proxy-lambda/badge.svg?branch=master)](https://coveralls.io/github/terma/api-gateway-proxy-lambda?branch=master)

Purpose: lambda to proxy incoming calls to defined host

## How to use

* Create lambda ```index.js```
* Setup API Gateway resource with ```ANY``` method
  * Enable proxy mode
  
## Configuration 

All configuration done by ```env``` [properties](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-environment.html)

- ```TARGET_DOMAIN: string, required``` - target proxy host (exclude protocol)
- ```TARGET_PORT: number, optional, default 80 for http and 443 for https``` - target proxy port
- ```CORS: boolean, optional, default false``` - automatically add CORS header to all responses
- ```CORS_AUTO_OPTIONS: boolean, optional, default false``` - replay on all OPTIONS request correct CORS for all ```*```
- ```EXCLUDE_PATH_PREFIX: string, optional, default empty``` - very useful for API Gateway, this string will be exclude from start of path. 
For example you send request to http://x/Stage1/start and want to proxy as http://target/start, just configure that property ```/Stage```
- ```PATH_PREFIX: string, optional, default empty``` - prefix to add in proxy path
  
Configuration example:
```yaml
Lambda
  Type: AWS::Lambda::Function
  Properties:
    Environment:
      Variables:
        TARGET_DOMAIN: test.com
        TARGET_PORT: 8080
        CORS: true
        CORS_AUTO_OPTIONS: false
        PATH_PREFIX: abb
        EXCLUDE_PATH_PREFIX: /Stage1
```  
  
## Releases

#### 0.2.1

- support CORS auto OPTIONS response when ```process.env.CORS_AUTO_OPTIONS = true``` 
- fix ```event.path``` to ```event.resourcePath```
- add coverage report

#### 0.2.0 
- support ```process.env.EXCLUDE_PATH_PREFIX: String``` if defined and path starts from it will be removed before proxy. For example path before proxy ```/Beta/test``` and exclude ```/Beta``` proxied path will be ```/test```
- fix ```httpMethod``` passing
- log incoming ```event``` and ```proxy request``` when ```process.env.DEBUG``` enabled
- support ```process.env.HTTPS: Boolean``` to use HTTPS for proxy request
- support ```process.env.CORS: Boolean``` to add CORS headers

#### 0.1.0 
- support ```process.env.PATH_PREFIX```

#### 0.0.1 
- initial release  
  