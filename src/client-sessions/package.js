Package.describe({
  summary: "A smart package for tracking clients across requests"
});

Package.on_use(function(api) {

  // Deps
  api.use('underscore', 'server');
  api.use('simple-secure', 'server');
  api.use('filters', 'server');

  // Vendor
  api.add_files('vendor/cookies.js', 'client');

  // Core
  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');
  api.add_files('common.js', ['client', 'server']);

  // Models
  api.add_files('models/client_session.js', ['client', 'server']);

  // Filters
  api.add_files('filters/client.js', 'client');
  api.add_files('filters/server.js', 'server');

  // Libraries
  api.add_files('utils/server.js', 'server');

  // Startup
  api.add_files('startup/server.js', 'server');
  api.add_files('startup/client.js', 'client');

});
