Package.describe({
  summary: "A lib for persisting Meteor's session info across requests (and browser sessions)"
});

Package.on_use(function(api) {
  // Deps
  api.use('underscore', 'server');
  api.use('session', 'client');
  api.use('simple-secure', 'server');
  api.use('model-extensions', 'server');
  api.use('filters', 'server');
  api.use('mongo-livedata', 'server');

  // Vendor
  api.add_files('vendor/cookies.js', 'client');
  // Core
  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');
  api.add_files('common.js', ['client', 'server']);
  // Models
  api.add_files('models/client_session.js', ['client', 'server']);
  // Libraries
  api.add_files('utils/server.js', 'server');
});
