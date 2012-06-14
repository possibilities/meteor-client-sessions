// Client session class

ClientSession = function(session) {
  _.extend(this, session);
  this.listeners = {};
};

// Setter and getter for client variables

ClientSession.prototype.set = function(key, value) {
  var clientSessionId = this._id;
  this.client[key] = value;
  ClientSessions.update(clientSessionId, { $set: { client: this.client } });
};

ClientSession.prototype.get = function(key) {
  return this.client[key];
};

// Handle events

ClientSession.prototype.on = function(event, callback) {
  this.listeners[event] || (this.listeners[event] = []);
  this.listeners[event].push(callback);
  
  return this;
};

ClientSession.prototype.trigger = function(event) {
  var self = this;
  _.each(this.listeners[event], function() {
    this.listeners[event](self);
  });
};

_.extend(ClientSession, Backbone.Events);

// Default config

ClientSession._config = {
  sessionCookieName: '_meteor_session_id',
  rememberCookieName: '_meteor_remember_id',
  rememberSessionForNDays: 15,
  exchangeKeyEveryNSeconds: 60,
  cookiePath: null,
  domainPath: null
};

// Handle configuration

ClientSession.config = function(config) {
  if (config)
    _.extend(this._config, config);
  else
    return this._config;
};

// Start filtering

Filter.methods([
  {
    handler: ClientSessionFilters.loadSession,
    callHandler: ClientSessionFilters.dumpSession
  }
]);
