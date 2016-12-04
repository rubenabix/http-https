'use strict';

const users = {
  'mari@infratec.com': {
    password: '123',
    name: 'Marian'
  },
  'jo@infratec.com': {
    password: '123',
    name: 'José'
  },
};

function validateGET(request, reply) {

  const input = request.query;

  if (users[input.user] && users[input.user].password === input.password) {
    reply({
      status: 'ok',
      message: users[input.user].name
    });
  } else {
    reply({
      status: 'error',
      message: 'Credenciales inválidas'
    });
  }
}

function validatePOST(request, reply) {

  const input = request.payload;

  if (users[input.user] && users[input.user].password === input.password) {
    reply({
      status: 'ok',
      message: users[input.user].name
    });
  } else {
    reply({
      status: 'error',
      message: 'Credenciales inválidas'
    });
  }
}

const Hapi = require('hapi');

const fs = require('fs');

const tls = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
};

const server = new Hapi.Server();
server.connection(
  {
    address: '0.0.0.0',
    tls: tls,
    port: process.env.PORT || 3447,
    labels: 'api-https',
    routes: {
      files: {
        relativeTo: __dirname + '/../clients/',
      },
      cors: true
    }
  }
);

server.connection(
  {
    address: '0.0.0.0',
    port: process.env.PORT || 3080,
    labels: 'api-http',
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
      [
        {
          method: 'GET',
          path: '/api/authenticate',
          config: {
            tags: ['api'],
            validate: {}
          },
          handler: validateGET
        },
        {
          method: 'POST',
          path: '/api/authenticate',
          config: {
            tags: ['api'],
            validate: {}
          },
          handler: validatePOST
        }
      ]
    );

    server.start((error) => {

      if (error) {
        throw error;
      }

      server.log('info', 'Hapi Server running at:');
      for (let connection of server.connections) {
        console.log(connection.info);
      }

    });
  });
