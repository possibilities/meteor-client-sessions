// Client model extensions

ClientSession = Model.extend({
  set: function(key, value) {
    this.client[key] = value;
    ClientSessions.update(this._id, { $set: { client: this.client } });
  },
  get: function(key) {
    return this.client[key];
  }
});

_.extend(ClientSession, Backbone.Events);

Model.register('clientSessions', ClientSession);
