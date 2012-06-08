// Define and secure collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions');
Secure.noDataMagic('clientSessionKeys');

SessionHelpers = {
  createOrRestoreSession: function(client) {
    var clientId;
    client = client || {};
    if (client.rememberCookie || client.sessionCookie) {
      clientId = this.restoreSession(client);
    }
    if (clientId) {
      this.updateKeyForSession(clientId);
    } else {
      clientId = this.createSession();
    }
    return clientId;
  },

  createSession: function() {
    var clientId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    this.updateKeyForSession(clientId);

    return clientId;
  },

  restoreSession: function(client) {
    var key, sessionKeyId;

    if (client.sessionCookie) {
      sessionKeyId = client.sessionCookie;
    } else {
      sessionKeyId = Utils.decodeRememberToken(client.rememberCookie);
    }

    if (sessionKeyId) {
      key = ClientSessionKeys.findOne(sessionKeyId)
      if (key) {
        if (ClientSessions.find(key.clientId).count() > 0) {
          return key.clientId;
        }
      }
    }
    
  }, 
  
  clearSession: function(clientId) {
    var key = this.createKeyForSession(clientId);
    ClientSessions.update(clientId, {
      $unset: {
        rememberCookie: true,
        rememberForNDays: true,
        rememberedAt: true,
      },
      $set: {
        latestKey: key,
        createdAt: new Date(),
        client: {}
      }
    });
  },

  createKeyForSession: function(clientId) {
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      clientId: clientId
    });
  },

  updateKeyForSession: function(clientId) {
    var key = this.createKeyForSession(clientId);
    ClientSessions.update(clientId, {
      $set: { latestKey: key }
    });
  }
};

Meteor.publish('clientSessions', function(client) {
  var clientId = SessionHelpers.createOrRestoreSession(client);
  return ClientSessions.find({ _id: clientId, deletedAt: null }, { limit: 1, fields: { rememberSalt: false } });
});

Meteor.methods({
  refreshClientSession: function() {
    SessionHelpers.updateKeyForSession(this.clientId);
  },
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = SessionHelpers.createKeyForSession(this.clientId);
    var rememberValues = {
      latestKey: key,
      rememberSalt: rememberSalt,
      rememberedAt: new Date(),
      rememberForNDays: 15,
      rememberCookie: Utils.encodeRememberToken(rememberSalt, key)
    };
    ClientSessions.update(this.clientId, { $set: rememberValues });
  },
  forgetClientSession: function() {
    SessionHelpers.clearSession(this.clientId);
  }
});
