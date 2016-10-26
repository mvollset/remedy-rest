"use strict";
var rest = require("node-rest-client").Client;
var request = require("request");
var querystring = require("querystring");
var http = require("http");
var _ = require("underscore");
var fs = require("fs");
var EventEmitter = require("events").EventEmitter;
var inherits = require("util").inherits;
module.exports = clientConnect;

function clientConnect(config) {
    return new Client(config);
}

function Client(config) {
    //if (!(this instanceof Client)) return new Client(config);
    this._config = config;
    this.userinfo = {
        username: config.username,
        password: config.password
    };
    this.serverinfo = {
        host: config.host,
        port: config.port
    }
    this.https = config.https;
    this.allowGuestuser = config.allowGuestuser;
    if (config.proxy_config) {
        this.proxy = config.proxy_config;
        this.restclient = new rest({
            proxy: this.proxy
        });
    } else
        this.restclient = new rest();

    if (config.clientTypeId || config.rpcQueue) {
        this.optionalHeaders = {};
        if (config.clientTypeId) {
            this.optionalHeaders["X-AR-Client-Type"] = config.clientTypeId
        }
        if (config.rpcQueue) {
            this.optionalHeaders["X-AR-RPC-Queue"] = config.rpcQueue
        }
    }

    this.rpcQueue = config.rpcQueue;
    this.rooturl = "http" + (this.https ? "s" : "") + "://" + this.serverinfo.host + ":" + this.serverinfo.port + "/api/arsys/v1/";
    this.token = null;
    EventEmitter.call(this);

}
inherits(Client, EventEmitter);
Client.prototype.urlMap = function(func) {

    }
    /** Utility functions
     */
    /*
    Parses the error messages returned by AR server
    */
Client.prototype.parseErrorResponse = function(data, response) {
    var headers = response.headers;
    if (!headers)
        return {
            type: "httpError",
            returnCode: response.returnCode,
            data: data
        }
    if (headers["Content-Type"] === "application/json") {
        if (data) {
            var errObj = JSON.parse(data);
        }
        return {
            type: "httpError",
            returnCode: response.returnCode,
            data: data,
            errObj: errObj
        }
    }
    return {
        type: "httpError",
        returnCode: response.returnCode,
        data: data
    }
};
/*
        Parses x-ar-messages returned in the header and checks if the user is logged in as a guest user
    */
Client.prototype.parseARMessages = function(headers) {
    var messages = headers["x-ar-messages"] ? JSON.parse(headers["x-ar-messages"]) : null;
    if (!messages)
        return null;
    var response = {
        messages: []
    };
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].messageType === "WARNING") {
            response.hasWarnings = true;
        }
        if (messages[i].messageType === "ERROR") {
            response.hasErrors = true;
        }
        if (messages[i].messageNumber === 59) {
            response.guestUser = true;
        }
        response.messages.push(messages[i]);
    }
    return response;
};
/*
Gets the entryId which is returned in the header for post requests
*/
Client.prototype.getNewEntryId = function(response) {
    var headers = response.headers;
    if (!headers)
        return null;
    if (!headers.location)
        return null;
    var parts = headers.location.split("/");
    return parts[parts.length - 1];
};
/*
Creates url from arguments for get requests and workaround the incompatibilities between AR rest and rest-client
*/
Client.prototype.createGetUrlFromArgs = function(args) {
    //Schema must always be included so we have
    var path = ["${schema}"];
    var queryp = [];
    for (var prop in args.path) {
        if (prop === "id") {
            path.push("${id}");
        }
    }
    for (var prop in args.parameters) {
        if (prop === "fields") {
            queryp.push("fields=values(${fields})");
            args.parameters.fields = this.getUrlParameters(args.parameters.fields).join(",");
        } else if (prop === "expand") {
            queryp.push("expand=assoc(${expand})");
            args.parameters.expand = this.getUrlParameters(args.parameters.expand).join(",");
        } else if (prop === "sort") {
            queryp.push("sort=${sort}");
            args.parameters.sort = this.getUrlParameters(args.parameters.sort).join(",");
        } else {
            queryp.push(prop + "=${" + prop + "}");
            args.parameters[prop] = encodeURIComponent(args.parameters[prop]);
        }

    }
    var url = this.rooturl + "entry/" + path.join("/")
    if (queryp.length > 0) {
        url = url + "?" + queryp.join("&");
    }
    var newpath = _.extend(args.path, args.parameters);
    args.parameters = null;
    args.path = newpath;
    return {
        url: url,
        args: args
    }
};
Client.prototype.urlEncodeArray = function(arr) {
    var ret = [];
    for (var i = 0; i < arr.length; i++) {
        ret.push(encodeURIComponent(arr[i]));
    }
    return ret;
};
Client.prototype.urlEncodeObject = function(obj) {
    var ret = {};
    var keys = _.keys(obj);
    for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (obj[key] !== null&& obj[key]!==undefined) {
            if (typeof(obj[key]) === "string" || obj[key] instanceof String)
                ret[key] = encodeURIComponent(obj[key]);
            else if (Array.isArray(obj[key]))
                ret[key] = this.urlEncodeArray(obj[key]);
            else
                ret[key] = this.urlEncodeObject(obj[key]);
        }
    }
    return ret;
};
Client.prototype.getUrlParameters = function(paramvalue) {
    if (Array.isArray(paramvalue))
        return this.urlEncodeArray(paramvalue);
    if (typeof(paramvalue) === "string" || paramvalue instanceof String)
        return this.urlEncodeArray([paramvalue]);
    return this.urlEncodeArray(_.keys(paramvalue));

};
/*
    Extracts attachments from postbody
*/
Client.prototype.extractAttachments = function(args) {
    if (args.data && args.data.attachments) {
        var retval = {};
        for (var prop in args.data.attachments) {
            retval["attach-" + prop] = args.data.attachments[prop].path;
        }
        //console.dir(retval);
        return retval;
    }
    return null;
};
Client.prototype.getStandardHeaders = function(additionalHeaders) {
    var headers = {
        "Content-Type": "application/json",
        "Authorization": this.token
    };
    if (this.additionalHeaders) {
        _.extend(header, this.additionalHeaders);
    }
    if (additionalHeaders)
        return _.extend(headers, additionalHeaders);
    return headers;
};
Client.prototype.getRequestOptions = function(options, additionalHeaders) {
    var defaultoptions = {
        host: this.proxy ? this.proxy.host : this.serverinfo.host,
        port: this.proxy ? this.proxy.port : this.serverinfo.port,
        tunnel: this.proxy ? this.proxy.tunnel : null,
        headers: this.getStandardHeaders()
    }
    return _.extend(defaultoptions, options);
}
Client.prototype.login = function(callback) {

    var post_data = querystring.stringify(this.userinfo);

    var post_options = this.getRequestOptions({
        path: "http" + (this.https ? "s" : "") + "://" + this.serverinfo.host + ":" + this.serverinfo.port + "/api/jwt/login",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(post_data)
        }
    });
    var self = this;
    var post_req = http.request(post_options, function(res) {
        if (res.statusCode !== 200) {
            callback({
                statusCode: res.statusCode
            })
        } else {
            res.setEncoding("utf8");
            res.on("data", function(chunk) {
                self.token = "AR-JWT " + chunk;
            }).on("end", function() {
                var result = self.parseARMessages(res.headers);
                if (!result || !result.hasWarnings || !result.hasErrors)
                    callback(null, "ok");
                else if (result.guestUser && this.allowGuestuser)
                    callback(null, "ok");
                else
                    callback(result.messages[0].messageText);
            })
        }
    });
    post_req.on("error", function(err) {
        //console.dir(err);
        callback(err);
    });
    post_req.write(post_data);
    post_req.end();
};

Client.prototype.options = function(args, callback) {
    var url = this.rooturl + "entry/" + args.path.schema;
    var self = this;
    var options = self.getRequestOptions({
        url: url,
        method: "OPTIONS"
    });
    request(options, function(err, response, body) {

        if (err) {
            var p = self.parseErrorResponse(body, response);
            callback({
                statusCode: response.statusCode,
                data: p.data,
                errObj: p.errObj
            });
        } else {
            if (response.statusCode !== 200) {
                var p = self.parseErrorResponse(body, response);
                callback({
                    statusCode: response.statusCode,
                    data: p.data,
                    errObj: p.errObj
                });

            } else
                callback(null, JSON.parse(body));
        }
    });

};
Client.prototype.get = function(args, callback) {
    var self = this;
    var o = {
        headers: self.getStandardHeaders()
    };
    var urlandargs = self.createGetUrlFromArgs(args);
    var rr = _.extend(o, urlandargs.args);
    self.restclient.get(urlandargs.url, rr, function(data, response) {
        if (response.statusCode === 200) {
            self.emit("data", data);
            if (callback)
                callback(null, data);
        } else {
            if (callback)
                callback({
                    statusCode: response.statusCode,
                    data: data
                });
        }
    });
};
Client.prototype.getAttachment = function(args, callback) {
    var self = this;
    var o = {
        headers: self.getStandardHeaders()
    };

    var rr = _.extend(o, args);
    self.restclient.get(self.rooturl + "entry/${schema}/${id}/attach/${attachfield}", rr, function(data, response) {
        if (response.statusCode === 200) {
            self.emit("data", data);
            if (callback)
                callback(null, data);
        } else {
            if (callback)
                callback({
                    statusCode: response.statusCode,
                    data: data
                });
        }
    });
}
Client.prototype.post = function(args, callback) {
    var self = this;
    var attachments = this.extractAttachments(args);
    if (attachments) {
        delete(args.data.attachments);
        self.requestWithAttachments(args, attachments, callback);
    } else {
        var o = {
            headers: self.getStandardHeaders()
        };
        args.path = self.urlEncodeObject(args.path);
        var rr = _.extend(o, args);
        this.restclient.post(self.rooturl + "entry/${schema}", rr, function(data, response) {
            if (response.statusCode === 201) {
                callback(null, {
                    data: data,
                    entryId: self.getNewEntryId(response),
                    statusCode: response.statusCode
                });
            } else {
                var errorMessage;
                if (response.statusCode === 401) {
                    data = [{
                        messageType: "ERROR",
                        messageText: "Not authorized",
                        messageNumber: 307
                    }];
                }
                callback({
                    statusCode: response.statusCode,
                    data: data
                });
            }

        });
    }

};
Client.prototype.requestWithAttachments = function(args, attachments, callback) {
    var self = this;
    var method = "POST";
    args.path = self.urlEncodeObject(args.path);
    var url = self.rooturl + "entry/" + args.path.schema;
    //If no ID assume post else put 
    if (args.path.id) {
        method = "PUT";
        url += "/" + args.path.id;
    }
    var jsonpart = JSON.stringify(args.data);
    var formData = {
        entry: {
            value: jsonpart,
            options: {
                contentType: "application/json; charset=UTF-8"
            }
        }

    }
    for (var attachment in attachments) {
        formData[attachment] = fs.createReadStream(attachments[attachment]);
    }
    var reqoptions = self.getRequestOptions({
        method: method,
        url: url,
        formData: formData,
        headers: {
            "authorization": self.token
        }
    });
    request(reqoptions,
        function(error, response, body) {
            if (error) {
                console.error("upload failed:", error);
                callback(error);
            } else {
                callback(null, {
                    entryId: method === "POST" ? self.getNewEntryId(response) : null,
                    statusCode: response.statusCode,
                    data: body
                });
            }

        });

};
Client.prototype.put = function(args, callback) {
    var self = this;
    var attachments = this.extractAttachments(args);
    if (attachments) {
        delete(args.data.attachments);
        this.requestWithAttachments(args, attachments, callback);
    } else {


        var o = {
            headers: self.getStandardHeaders()
        };
        args.path = self.urlEncodeObject(args.path);
        var rr = _.extend(o, args);
        this.restclient.put(self.rooturl + "entry/${schema}/${id}", rr, function(data, response) {
            if (response.statusCode === 204) {
                callback(null, {
                    data: data,
                    statusCode: response.statusCode
                });
            } else {
                var errorMessage;
                if (response.statusCode === 401) {
                    data = [{
                        messageType: "ERROR",
                        messageText: "Not authorized",
                        messageNumber: 307
                    }];
                }
                callback({
                    statusCode: response.statusCode,
                    data: data
                });
            }
        });
    }
};
Client.prototype.delete = function(args, callback) {
    var self = this;
    var o = {
        headers: self.getStandardHeaders()
    };
    args.path = self.urlEncodeObject(args.path);
    var rr = _.extend(o, args);
    this.restclient.delete(self.rooturl + "entry/${schema}/${id}", rr, function(data, response) {
        if (response.statusCode === 204) {
            callback(null, {
                data: data,
                statusCode: response.statusCode
            });
        } else {
            var errorMessage;
            if (response.statusCode === 401) {
                data = [{
                    messageType: "ERROR",
                    messageText: "Not authorized",
                    messageNumber: 307
                }];
            }
            callback({
                statusCode: response.statusCode,
                data: data
            });
        }
    });

};