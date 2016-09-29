remedy-rest
==============
[![Coverage Status](https://coveralls.io/repos/github/mvollset/remedy-rest/badge.svg?branch=master)](https://coveralls.io/github/mvollset/remedy-rest?branch=master)

Node.js rest client for ARS

## Installation
 `npm install remedy-rest`

##Usage

```js
var remedy=require('remedy-rest');
var client=remedy({
        username: "Demo",
        password: "password",
        host: "remedy01.test.local",//Server where the rest api is running usually the AR server
        port: "8008",//Port where the rest api is exposed.
        https: false,
        allowGuestuser: false
});

```

##Quick example
Lists all mailboxes in AR System Email Mailbox Configuration
```js
var remedy = require('remedy-rest');
var client = remedy({
    username: "Demo",
    password: "password",
    host: "remedy01.test.local", //Server where the rest api is running, usually the AR server
    port: "8008", //Port where the rest api is exposed.
    https: false
});

client.login(function(err, callback) {
    if (err) {
        console.log(err);
    } else {
        client.get({
            path: {
                schema: "AR System Email Mailbox Configuration" //AR Schema name
            }
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < data.entries.length; i++) {
                    console.log(data.entries[i].value["Mailbox Name"]);
                }
            }
        });
    }
});
```

##Search example
Find user Demo in the User schema.
```js
var remedy = require('remedy-rest');
var client = remedy({
    username: "Demo",
    password: "password",
    host: "remedy01.test.local", //Server where the rest api is running, usually the AR server
    port: "8008", //Port where the rest api is exposed.
    https: false
});

client.login(function(err, callback) {
    if (err) {
        console.log(err);
    } else {
        client.get({
            path: {
                schema: "User" //AR Schema name
            },
            parameters: {
                q: "'Login Name'=\"Demo\"",
                fields: ["Login Name"]
            }
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < data.entries.length; i++) {
                    console.log(data.entries[i].value["Login Name"]);
                }
            }
        });
    }
});
```

##Post example
Post an entry to a form.
```js
var remedy = require('remedy-rest');
var client = remedy({
    username: "Demo",
    password: "password",
    host: "remedy01.test.local", //Server where the rest api is running, usually the AR server
    port: "8008", //Port where the rest api is exposed.
    https: false
});

client.login(function(err, callback) {
    if (err) {
        console.log(err);
    } else {
        client.post({
            path: {
                schema: "Simple Form" //AR Schema name
            },
            data: {
                values: {
                    "Submitter": "Allen",
                    "Short Description": "testing 123"
                }
            }
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data.entryId)
            }
        });
    }
});
```

##Put example
Update an entry
```js
var remedy = require('remedy-rest');
var client = remedy({
    username: "Demo",
    password: "password",
    host: "remedy01.test.local", //Server where the rest api is running, usually the AR server
    port: "8008", //Port where the rest api is exposed.
    https: false
});

client.login(function(err, callback) {
    if (err) {
        console.log(err);
    } else {
        client.put({
            path: {
                schema: "Simple Form", //AR Schema name
                id:"0000000000000001"
            },
            data: {
                values: {
                    "Short Description": "Updated Description"
                }
            }
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data)
            }
        });
    }
});
```

##Post example with attachments
Update an entry
```js
var remedy = require('remedy-rest');
var client = remedy({
    username: "Demo",
    password: "password",
    host: "remedy01.test.local", //Server where the rest api is running, usually the AR server
    port: "8008", //Port where the rest api is exposed.
    https: false
});

client.login(function(err, callback) {
    if (err) {
        console.log(err);
    } else {
        client.post({
            path: {
                schema: "Simple Form" //AR Schema name
               
            },
            data: {
                values: {
                    "Short Description": "With attachment",
                    "Status":0,
                    "Attachment_2": "1.txt",
                    "Attachment_1": "2.txt"
                },
                attachments: {
                        "Attachment_2": {
                            path: "./test/testdata/2.txt"
                        },
                        "Attachment_1": {
                            path: "./test/testdata/1.txt"
                        }
                    }
            }
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data.entryId)
            }
        });
    }
});
```

##Complete config options

 - username 
 - password
 - host
 - port
 - allowGuestuser true of false defaults to false
 - proxy_config object
 
 ```
 proxy_config:{
    host:'proxy.local',
    port:3333
 }
 ```
 
 - clientTypeId This will be added in http headers as "X-AR-Client-Type"
 - rpcQueue Setting this will add the "X-AR-RPC-Queue" header. And AR server requests will be routed to this queue



## Tests
Import def file located in the defs folder and run:
 `npm test`


## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


