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
  api.add_files('filters.js', ['server', 'client']);
  api.add_files('common.js', ['client', 'server']);
  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');

  // Libraries
  api.add_files('utils/server.js', 'server');
  api.add_files('utils/common.js', ['client', 'server']);

});
