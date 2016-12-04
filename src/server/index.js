'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection(
  {
    port: process.env.PORT || 3008,
    labels: 'api',
    routes: {
      files: {
        relativeTo: __dirname + '/../clients/',
      },
      cors: true
    }
  }
);

server.register(
  [
    {
      register: require('vision'),
      options: {}
    },
    {
      register: require('inert'),
      options: {}
    },
    {
      register: require('blipp'),
      options: {
        showAuth: true
      }
    },
    {
      register: require('good'),
      options: {
        reporters: {
          console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
              response: '*',
              log: '*'
            }]
          }, {
            module: 'good-console'
          }, 'stdout']
        }
      }
    }
  ], (error) => {

    if (error) {
      throw error; // something bad happened loading the plugin
    }

    server.register([
      {
        register: require('hapi-swagger'),
        options: {
          'info': {
            'title': 'HS Services',
            'version': '1.0.0',
            'contact': {
              'name': 'Herigates Team',
              'email': 'rubenabix@gmail.com'
            }
          },
          jsonEditor: true
        }
      }
    ]);

    server.route(
      {
        method: 'GET',
        path: '/{path*}',
        handler: {
          directory: {
            path: './',
            redirectToSlash: true
          }
        },
        config: {
          tags: ['web'],
          auth: false,
          validate: {
            query: {}
          }
        }
      }
    );

    server.route(
      {
        method: 'GET',
        path: '/api/get',
        config: {
          tags: ['api'],
          description: 'Get current server connections',
          notes: 'Current server connections.',
          validate: {}
        },
        handler: function (request, reply) {
          reply(request.server.plugins['hapi-pub-sub'].getStatus());
        }
      }
    );

    server.start((error) => {

      if (error) {
        throw error;
      }

      server.log('info', 'Hapi Server running at: ' + server.info.uri);

    });
  });
