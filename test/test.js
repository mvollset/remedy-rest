"use strict";

var expect = require("chai").expect;
var remedy = require("../index");
var config = require("./config.js");
var async = require("async");
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
                password: "notverylikelypassword..................."
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
                username: "notverylikelyusername...................",
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
        it("Should return rows on form [Short Description] [Status]", function(done) {

            remedyClient.get({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                parameters: {
                    limit: 5,
                    offset: 0,
                    fields: ["Short Description", "Status"]
                }
            }, function(err, result) {
                expect(result.entries).to.be.instanceOf(Array);
                expect(result.entries[0].values).to.have.property("Short Description");
                expect(result.entries[0].values).to.have.property("Status");
                expect(result.entries[0].values).to.not.have.property("Assigned To");
                done();
            })
        });
        it("Should return rows sorted asc on requestid", function(done) {

            remedyClient.get({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                parameters: {
                    limit: 5,
                    offset: 0,
                    fields: ["Short Description", "Status", "Request ID"],
                    sort: ["Request ID.ASC"]
                }
            }, function(err, result) {
                expect(result.entries).to.be.instanceOf(Array);
                expect((result.entries[0].values["Request ID"] < result.entries[1].values["Request ID"])).to.be.equal(true);

                done();
            })
        });
        it("Should return rows sorted asc on requestid", function(done) {
            remedyClient.get({
                path: {
                    schema: "User" //AR Schema name
                },
                parameters: {
                    q: "'Login Name'=\"Demo\"",
                    fields: "Login Name"
                }
            }, function(err, result) {
                expect(result.entries.length).to.equal(1);
                expect(result.entries[0].values["Login Name"]).to.equal("Demo");
                done();
            });

        });


    });
    describe("#Post", function() {
        var remedyClient = remedy(config);
        before(function(done) {
            remedyClient.login(function(err, result) {
                done();
            });
        });
        it("Should create a row", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description"
                    }
                }
            }, function(err, result) {
                expect(result.entryId.length).to.equal(15);
                done();
            })
        });
        it("Should create a row with an attachment", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description",
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
            }, function(err, result) {
                var id = result.entryId;
                expect(result.entryId.length).to.equal(15);
                remedyClient.get({
                    path: {
                        schema: "SYSCOM:REST:TEST",
                        id: id
                    }
                }, function(err, result) {
                    expect(result.values["Request ID"]).to.equal(id);
                    done();

                });
            });

        });
        it("Should fail to ceate a row ", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0
                    }
                }
            }, function(err, result) {
                expect(err).to.not.equal(null);
                expect(err.statusCode).to.equal(500);
                expect(err.data[0].messageNumber).to.equal(307);
                done();
            });

        });
        it("Should create a row, get it, then delete the row ", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description"
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
            }, function(err, result) {
                var id = result.entryId;
                expect(result.entryId.length).to.equal(15);
                remedyClient.get({
                    path: {
                        schema: "SYSCOM:REST:TEST",
                        id: id
                    }
                }, function(err, result) {
                    expect(result.values["Request ID"]).to.equal(id);
                    remedyClient.delete({
                        path: {
                            schema: "SYSCOM:REST:TEST",
                            id: id
                        }
                    }, function(err, data) {
                        if (err) {
                            console.log(err);
                        }
                        expect(data.statusCode).to.equal(204);
                        done();
                    })


                });
            });

        });
    });
    describe("#Put", function() {
        var remedyClient = remedy(config);
        before(function(done) {
            remedyClient.login(function(err, result) {
                done();
            });
        });
        var entryId;
        it("First create a new row", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description"
                    }
                }
            }, function(err, result) {
                expect(result.entryId.length).to.equal(15);
                entryId = result.entryId
                done();
            })
        });
        it("Should update a row with new status and Description", function(done) {

            remedyClient.put({
                path: {
                    schema: "SYSCOM:REST:TEST",
                    id: entryId
                },
                data: {
                    values: {
                        "Status": 2,
                        "Short Description": "Updated Description"
                    }
                }
            }, function(err, result) {

                expect(err).to.equal(null);
                expect(result.statusCode).to.equal(204);
                done();
            })
        });
        it("Should update a row with new attachment and Description", function(done) {

            remedyClient.put({
                path: {
                    schema: "SYSCOM:REST:TEST",
                    id: entryId
                },
                data: {
                    values: {
                        "Status": 2,
                        "Short Description": "Yet another Description",
                        "Attachment_1": "2.txt"
                    },
                    attachments: {
                        "Attachment_1": {
                            path: "./test/testdata/1.txt"
                        }
                    }
                }
            }, function(err, result) {

                expect(err).to.equal(null);
                expect(result.statusCode).to.equal(204);
                done();
            })
        });
    });

    describe("#Options", function() {
        var remedyClient = remedy(config);
        before(function(done) {
            remedyClient.login(function(err, result) {
                done();
            });
        });
        var entryId;
        it("Get options for the form", function(done) {

            remedyClient.options({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description"
                    }
                }
            }, function(err, result) {
                expect(err).to.equal(null);
                done();
            })
        });

    });
    describe("#Attachments", function() {
        var remedyClient = remedy(config);
        var entryId;
        before(function(done) {
            async.series([function(callback) {
                    remedyClient.login(function(err, result) {
                        callback();
                    });
                },
                function(callback) {
                    remedyClient.post({
                        path: {
                            schema: "SYSCOM:REST:TEST"
                        },
                        data: {
                            values: {
                                "Status": 0,
                                "Short Description": "Description",
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
                    }, function(err, result) {
                        entryId = result.entryId;
                        callback();

                    });
                }
            ], function() {
                done();
            });
        });
        it("Get Attachment", function(done) {

            remedyClient.getAttachment({
                path: {
                    schema: "SYSCOM:REST:TEST",
                    id: entryId,
                    attachfield: "Attachment_1"
                }
            }, function(err, result) {
                expect(err).to.equal(null);
                done();
            })
        });

    });
    describe("#Check unauthorized", function() {
        var remedyClient = remedy(config);
        before(function(done) {
            remedyClient.login(function(err, result) {
                //Clear login token to fail
                remedyClient.token = "daskdakdjhaksd";
                done();
            });
        });
        var entryId;
        it("Get options for the form without login i", function(done) {

            remedyClient.options({
                path: {
                    schema: "SYSCOM:REST:TEST"
                },
                data: {
                    values: {
                        "Status": 0,
                        "Short Description": "Description"
                    }
                }
            }, function(err, result) {
                expect(err).to.not.equal(null);
                expect(err.statusCode).to.equal(401);
                done();
            })
        });
        it("Get entry for the form without login i", function(done) {

            remedyClient.get({
                path: {
                    schema: "SYSCOM:REST:TEST"
                }
            }, function(err, result) {
                expect(err).to.not.equal(null);
                expect(err.statusCode).to.equal(401);
                done();
            })
        });
        it("Post entry for the form without login i", function(done) {

            remedyClient.post({
                path: {
                    schema: "SYSCOM:REST:TEST"
                }
            }, function(err, result) {
                expect(err).to.not.equal(null);
                expect(err.statusCode).to.equal(401);
                done();
            })
        });
        it("Put entry for the form without login i", function(done) {

            remedyClient.put({
                path: {
                    schema: "SYSCOM:REST:TEST",
                    id: entryId
                }
            }, function(err, result) {
                expect(err).to.not.equal(null);
                expect(err.statusCode).to.equal(401);
                done();
            })
        });

    });
});
