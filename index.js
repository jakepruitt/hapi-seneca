/**********************************************
 * hapi-seneca
 * -----------
 *
 * This module returns a Hapi plugin that
 * allows seneca-web functionality to work
 * as expected in the Hapi framework.
 *
 * @params
 *      When used with framework, the options
 *      object should have the `seneca` option
 *      referencing the seneca instance that 
 *      any seneca-web actions have been called
 *      on.
 *      The `cors` option should be set to true
 *      if the API is to be accessed by other
 *      websites.
 *
 * @returns
 *      A Hapi plugin that can be registered
 *      to a hapi instance with:
 *      server.register({
 *        register: require('hapi-seneca');
 *        options: {
 *          seneca: seneca,
 *          cors: true
 *        }
 *      }, cb);
 *
 * Note: most of the logic for this module
 *      lies in the 'hapi-to-express' module.
 *********************************************/

var hapiToExpress = require('hapi-to-express');
var cookieparser = require('cookie-parser');
var session = require('express-session');

var hapiSeneca = {
  register: function (server, options, next) {
    var seneca = options.seneca;
    
    // Create appropriate Hapi cors option object:
    if (options.cors) {
      options.cors = {
        credentials: true
      };
    }

    // Create Hapi Default route handler
    var handler = function (request, reply) {
      return reply('The page was not found').code(404);
    };

    // Allow CORS based on cors option for plugin
    server.route({
      method: '*', 
      path: '/{p*}', 
      handler: handler, 
      config: { cors: options.cors }
    });
    
    server.ext('onPostAuth', function(request, reply) {
      var hapress = hapiToExpress(request, reply);
      
      // TODO allow setting/enabling these externally and refactor
      var cookie = cookieparser();
      var sess = session({ /*store: sessionStore, */secret: 'seneca', name: 'CD.ZENPLATFORM', saveUninitialized: true, resave: true });

      cookie(hapress.req, hapress.res, function(err) {
        if (err) { return reply(err); }

        sess(hapress.req, hapress.res, function(err) {
          if (err) { return reply(err); }

          var app = seneca.export('web');

          app(hapress.req, hapress.res, function(err) {
            if (err) { return reply(err); }    
            reply.continue();
          });
        });
      });
    });

    next();
  }
};

hapiSeneca.register.attributes = {
  name: 'hapi-seneca',
  version: '1.0.0'
};

module.exports = hapiSeneca;
