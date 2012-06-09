// Client model extensions

ClientSession = function(session) {
  _.extend(this, session);
};

ClientSession.prototype.set = function(key, value) {
  this.client[key] = value;
  ClientSessions.update(this._id, { $set: { client: this.client } });
};

ClientSession.prototype.get =  function(key) {
  return this.client[key];
};

_.extend(ClientSession, Backbone.Events);
