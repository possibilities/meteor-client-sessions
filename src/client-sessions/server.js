// Define and secure collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions', 'clientSessionKeys');

SessionHelpers = {
  createOrRestoreSession: function(client) {
    var sessionId;
    if (client && (client.rememberCookie || client.sessionCookie)) {
      sessionId = this.restoreSession(client);
    }
    return sessionId || this.createSession();
  },

  createKeyForSession: function(sessionId) {
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      sessionId: sessionId
    });
  },

  createSession: function() {
    var sessionId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    var key = SessionHelpers.createKeyForSession(sessionId);
    ClientSessions.update(sessionId, {
      $set: { latestKey: key }
    });

    return sessionId;
  },

  restoreSession: function(client) {
    var key, session;
    if (client.sessionCookie && (key = ClientSessionKeys.findOne(client.sessionCookie))) {
      if (key && (session = ClientSessions.findOne(key.sessionId))) {
        return session._id;
      }
    }
  }, 
  
  clearSession: function(sessionId) {
    var key = SessionHelpers.createKeyForSession(sessionId);
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
  }
};

Meteor.publish('clientSessionFeed', function(client) {
  var sessionId = SessionHelpers.createOrRestoreSession(client);
  return ClientSessions.find({ _id: sessionId, deletedAt: null }, { limit: 1, fields: { rememberSalt: false } });
});

Meteor.methods({
  refreshClientSession: function(sessionId) {
    var key = SessionHelpers.createKeyForSession(sessionId);
    ClientSessions.update(sessionId, {
      $set: { latestKey: key }
    });
  },
  rememberClientSession: function(sessionId) {
    var rememberSalt = Meteor.uuid();
    var key = SessionHelpers.createKeyForSession(sessionId);
    var rememberValues = {
      latestKey: key,
      rememberSalt: rememberSalt,
      rememberedAt: new Date(),
      rememberForNDays: 15,
      rememberCookie: Utils.encodeRememberToken(rememberSalt, sessionId)
    };
    ClientSessions.update(sessionId, { $set: rememberValues });
  },
  forgetClientSession: function(sessionId) {
    SessionHelpers.clearSession(sessionId);
  }
});
