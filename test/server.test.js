var Hapi = require('hapi');
var seneca = require('seneca')();
var test = require('tape');
var request = require('request');
    
var server = new Hapi.Server();

test('setup', function(assert) {
    server.connection({
        port: 4000,
        host: 'localhost'
    });

    seneca.add({role: 'test', cmd: 'test'}, function(args, done) {
      console.log('Recieved a request');
      done(null, {worked: true});
    });

    seneca.act('role:web', {use: {
      prefix: '/api/1.0',
      pin: {role:'test', cmd: '*'},
      map: {
        test: true
      }
    }});

    server.register({
      register: require('..'),
      options: {
        seneca: seneca,
        cors: true
      }
    }, function(err) {
      if (err) console.error(err);
      server.start(function() {
        console.log('Server is running');
        assert.end();
      });
    });
});

test('proper response', function(assert) {
    var opts = {
        method: 'GET',
        uri: 'http://localhost:4000/api/1.0/test/test'
    };

    request(opts, function(err, res) {
        assert.ifError(err);
        assert.ok(res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body, '{"worked":true}');
        assert.end();
    });
});

test('teardown', function(assert) {
    server.stop(function(err) {
        assert.ifError(err);
        assert.end();
    });
});
