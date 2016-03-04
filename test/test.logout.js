/**
 * Created by Oscar Iu on 10/02/2016.
 */

var should = require("should");
var mongoose = require('mongoose');
var Account = require("../models/account.ts");
var db;

describe('Account', function() {

    before(function(done) {
        db = mongoose.connect('mongodb://localhost/test');
        done();
    });

    after(function(done) {
        mongoose.connection.close();
        done();
    });

    beforeEach(function(done) {
        var account = new Account({
            username: 'testuser',
            password: 'abcd'
        });

        account.save(function(error) {
            if (error) console.log('error' + error.message);
            else console.log('no error');
            done();
        });
    });

    it('find a user by username', function(done) {
        Account.findOne({ username: 'testuser' }, function(err, account) {
            account.username.should.eql('testuser');
            console.log("   username: ", account.username);
            //logout user

            //done();
        });
    });

    it('find a user by username', function(done) {
        Account.findOne({ username: 'testuser' }, function(err, account) {
            account.username.should.eql('testuser');
            console.log("   username: ", account.username);
            //find user by username again - print not present

            done();
        });
    });

    afterEach(function(done) {
        Account.remove({}, function() {
            done();
        });
    });

});