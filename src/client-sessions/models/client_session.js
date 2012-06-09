// Client session class

ClientSession = function(session) {
  _.extend(this, session);
  this.listeners = {};
};

// Setter and getter for client variables

ClientSession.prototype.set = function(key, value) {
  this.client[key] = value;
  ClientSessions.update(this._id, { $set: { client: this.client } });
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
  sessionKey: '_meteor_session_id',
  rememberKey: '_meteor_remember_id'
};

// Handle configuration

ClientSession.config = function(config) {
  if (config)
    _.extend(this._config, config);
  else
    return this._config;
};
