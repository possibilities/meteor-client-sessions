Package.describe({
  summary: "A lib for persisting Meteor's session info across requests (and browser sessions)"
});

Package.on_use(function (api) {
  // Deps
  api.use('underscore', 'server');
  api.use('session', 'client');
  api.use('simple-secure', 'server');
  api.use('filters', 'server');
  api.use('mongo-livedata', 'server');

  // Vendor
  api.add_files('vendor/cookies.js', 'client');

  // Core
  api.add_files('common.js', ['client', 'server']);
  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');
  // Filters
  api.add_files('filters/client.js', 'client');
  api.add_files('filters/server.js', 'server');
  // Kick it off!
  api.add_files('startup/client.js', 'client');
  api.add_files('startup/server.js', 'server');
  api.add_files('startup/common.js', ['server', 'client']);
});
