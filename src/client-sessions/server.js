// Define and secure collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions', 'clientSessionKeys');

SessionHelpers = {
  createOrRestoreSession: function(client) {
    var sessionId;
    client = client || {};
    if (client.rememberCookie || client.sessionCookie) {
      sessionId = this.restoreSession(client);
    }
    if (sessionId) {
      this.createLatestKeyForSession(sessionId);
    } else {
      sessionId = this.createSession();
    }
    return sessionId;
  },

  createSession: function() {
    var sessionId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    this.createLatestKeyForSession(sessionId);

    return sessionId;
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
        if (ClientSessions.find(key.sessionId).count() > 0) {
          return key.sessionId;
        }
      }
    }
    
  }, 
  
  clearSession: function(sessionId) {
    var key = this.createKeyForSession(sessionId);
    ClientSessions.update(sessionId, {
      $unset: {
        rememberCookie: true,
        rememberForNDays: true,
        rememeberedAt: true,
      },
      $set: {
        latestKey: key,
        createdAt: new Date(),
        client: {}
      }
    });
  },

  createKeyForSession: function(sessionId) {
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      sessionId: sessionId
    });
  },

  createLatestKeyForSession: function(sessionId) {
    var key = this.createKeyForSession(sessionId);
    ClientSessions.update(sessionId, {
      $set: { latestKey: key }
    });
  }
};

Meteor.publish('clientSessions', function(client) {
  var sessionId = SessionHelpers.createOrRestoreSession(client);
  return ClientSessions.find({ _id: sessionId, deletedAt: null }, { limit: 1, fields: { rememberSalt: false } });
});

Meteor.methods({
  refreshClientSession: function() {
    SessionHelpers.createLatestKeyForSession(this.sessionId);
  },
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = SessionHelpers.createKeyForSession(this.sessionId);
    var rememberValues = {
      latestKey: key,
      rememberSalt: rememberSalt,
      rememberedAt: new Date(),
      rememberForNDays: 15,
      rememberCookie: Utils.encodeRememberToken(rememberSalt, key)
    };
    ClientSessions.update(this.sessionId, { $set: rememberValues });
  },
  forgetClientSession: function() {
    SessionHelpers.clearSession(this.sessionId);
  }
});
