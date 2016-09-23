"use strict";

var expect = require("chai").expect;
var remedy = require("../index");
var config = require("./config.js");
var _ = require("underscore");

describe("#Remedy Rest", function() {
    describe("#login", function() {
        it("Should login", function(done) {
            var remedyClient = remedy(config);
            remedyClient.login(function(err, result) {
                expect(result).to.equal("ok");
                done();
            });

        });
        it("Should fail to login", function(done) {
            var localconfig = {
                userinfo: {
                    password: "notverylikelypassword..................."
                }
            };
            localconfig = _.extend(config, localconfig);
            var remedyClient = remedy(localconfig);
            remedyClient.login(function(err, result) {;
                expect(err).to.not.equal(null);
                expect(result).not.equal("ok");
                done();
            });
        });
        it("Should get guestuser", function(done) {
            var localconfig = {
                userinfo: {
                    username: "notverylikelyusername..................."
                },
                allowGuestuser: true
            };
            localconfig = _.extend(config, localconfig);
            var remedyClient = remedy(localconfig);
            remedyClient.login(function(err, result) {
                expect(remedyClient.token).to.not.equal(null);
                done();
            });
        });
    });
    describe("#Get", function() {
        var remedyClient = remedy(config);
        before(function(done) {
            remedyClient.login(function(err, result) {
                done();
            });
        });
        it("Should return rows", function(done) {

            remedyClient.get({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                parameters: {
                    limit: 5,
                    offset: 0
                }
            }, function(err, result) {
                expect(result.entries).to.be.instanceOf(Array);
                done();
            })
        });

        it("Should return 1 row", function(done) {
            remedyClient.get({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                parameters: {
                    limit: 1,
                    offset: 0
                }
            }, function(err, result) {
                expect(result.entries).to.be.instanceOf(Array);
                expect(result.entries.length).to.equal(1);
                done();
            });

        });


    });
});
