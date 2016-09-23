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
var remedy=require('remedy-rest');
var client=remedy({
        username: "Demo",
        password: "password",
        host: "remedy01.test.local",//Server where the rest api is running, usually the AR server
        port: "8008",//Port where the rest api is exposed.
        https: false
});

client.login(function(err,callback){
    if(err){
        console.log(err);
    }
    else{
        client.get({
                    path: {
                            schema: "AR System Email Mailbox Configuration" //AR Schema name
                        }
            },function(err,data){
                if(err){
                    console.log(err);
                }
                else{
                    for(var i=0;i<data.entries.length;i++){
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
var remedy=require('remedy-rest');
var client=remedy({
        username: "Demo",
        password: "password",
        host: "remedy01.test.local",//Server where the rest api is running, usually the AR server
        port: "8008",//Port where the rest api is exposed.
        https: false
});

client.login(function(err,callback){
    if(err){
        console.log(err);
    }
    else{
        client.get({
                    path: {
                            schema: "User" //AR Schema name
                        },
                        parameters:{
                            q:"'Login Name'=\"Demo\"",
                            fields:["Login Name"]
                        }
            },function(err,data){
                if(err){
                    console.log(err);
                }
                else{
                    for(var i=0;i<data.entries.length;i++){
                        console.log(data.entries[i].value["Login Name"]);
                    }
                }
                });
    }
    });
```

##Post example
Find user Demo in the User schema.
```js
var remedy=require('remedy-rest');
var client=remedy({
        username: "Demo",
        password: "password",
        host: "remedy01.test.local",//Server where the rest api is running, usually the AR server
        port: "8008",//Port where the rest api is exposed.
        https: false
});

client.login(function(err,callback){
    if(err){
        console.log(err);
    }
    else{
        client.post({
                    path: {
                            schema: "Simple Form" //AR Schema name
                        },
                        data:{
                            values:{
                                "Submitter":"Allen",
                                "Short Description":"testing 123"
                            }
                        }
            },function(err,data){
                if(err){
                    console.log(err);
                }
                else{
                   console.log(data.entryId)
                }
                });
    }
    });
```
## Tests
Import def file located in the defs folder and run:
 `npm test`


## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


