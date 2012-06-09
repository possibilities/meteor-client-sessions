// Client model extensions

ClientSession = function(session) {
  _.extend(this, session);
  this.listeners = {};
};

ClientSession.prototype.set = function(key, value) {
  this.client[key] = value;
  ClientSessions.update(this._id, { $set: { client: this.client } });
};

ClientSession.prototype.get = function(key) {
  return this.client[key];
};

ClientSession.prototype.on = function(event, callback) {
  this.listeners[event] || (this.listeners[event] = []);
  this.listeners[event].push(callback);
};

ClientSession.prototype.trigger = function(event) {
  var self = this;
  _.each(this.listeners[event], function() {
    this.listeners[event](self);
  });
};

_.extend(ClientSession, Backbone.Events);
