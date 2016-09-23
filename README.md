remedy-rest
==============
[![Coverage Status](https://coveralls.io/repos/github/mvollset/remedy-rest/badge.svg?branch=master)](https://coveralls.io/github/mvollset/remedy-rest?branch=master)

Node.js rest client for ARS

## Installation
 `npm install remedy-rest`

##Usage

'''js
var remedy=require('remedy-rest');
var client=remedy({
        username: "Demo",
        password: "password",
        host: "remedy01.test.local",//Server where the rest api is running usually the AR server
        port: "8008",//Port where the rest api is exposed.
        https: false,
        allowGuestuser: false
});

'''

## Tests
 `npm test`


## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


