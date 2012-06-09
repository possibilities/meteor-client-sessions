// Define and secure collections

// { clientId,
//		createdAt: Date
//		client: {}
//		key: points to ClientSessionKeys.sessionId
//		rememberCookie: boolean/string
//		rememberSalt: empty or Meteor.uuid
//		expires: boolean/Date }
ClientSessions = new Meteor.Collection('clientSessions');


// { sessionId, clientId: points to ClientSessions.clientId, createdAt: Date, deletedAt: Date }
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions');
Secure.noDataMagic('clientSessionKeys');

SessionHelpers = {
  createOrRestoreSession: function(clientCookies) {
    var clientId;
    clientCookies = clientCookies || {};
    if (clientCookies.rememberCookie || clientCookies.sessionCookie) {
      clientId = this.restoreSession(clientCookies);
    }
    if (clientId) {
      this.updateKeyForSession(clientId);
    } else {
      clientId = this.createSession();
    }
    return clientId;
  },


  // Creates a new ClientId
  createSession: function() {
    var clientId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    this.updateKeyForSession(clientId);

    return clientId;
  },

  restoreSession: function(clientCookies) {
    var record, sessionId;

    if (clientCookies.sessionCookie) {
      sessionId = clientCookies.sessionCookie;
    } else {
      sessionId = Utils.decodeRememberToken(clientCookies.rememberCookie);
    }

    if (sessionId) {
      record = ClientSessionKeys.findOne(sessionId);
      if (record) {
        if (ClientSessions.find(record.clientId).count() > 0) {
          return record.clientId;
        }
      }
    }
    
  }, 
  
  clearSession: function(clientId) {
    var sessionId = this.createKeyForSession(clientId);
    ClientSessions.update(clientId, {
      $unset: {
        rememberCookie: true,
        expires: true
      },
      $set: {
        key: sessionId,
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
    var sessionId = this.createKeyForSession(clientId);
    ClientSessions.update(clientId, {
      $set: { key: sessionId }
    });
  }
};

Meteor.publish('clientSessions', function(clientCookies) {
  var self = this;
  var clientId = SessionHelpers.createOrRestoreSession(clientCookies);
  var clientSessionQuery = ClientSessions.find({ _id: clientId, deletedAt: null }, { limit: 1, fields: { rememberSalt: false } });
  var uuid = Meteor.uuid();

  var prepareClientSession = function(raw) {
    return {
      client: raw.client,
      key: raw.key,
      rememberCookie: raw.rememberCookie,
      expires: raw.expires
    };
  };

  var handle = clientSessionQuery.observe({

    added: function (clientSession) {

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Publish
      self.set("clientSessions", uuid, clientSession);
      self.complete();
      self.flush();
    },
    
    changed: function (clientSession, index, oldClientSession) {

      // Figure out which keys have been deleted and unset them
      var deleteKeys = _.difference(_.keys(oldClientSession), _.keys(clientSession));
      self.unset('clientSessions', uuid, deleteKeys);

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Publish
      self.set("clientSessions", uuid, clientSession);
      self.flush();
    }
  });

   // remove data and turn off observe when client unsubs
   self.onStop(function () {
     handle.stop();
     self.unset('clientSessions', uuid, []);
     self.flush();
   });
});

Meteor.methods({
  
  // Get a new key for an established session
  refreshClientSession: function() {
    SessionHelpers.updateKeyForSession(this.clientSession._id);
  },
  
  // Remember the session after the browser session is over
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = SessionHelpers.createKeyForSession(this.clientSession._id);
    var rememberValues = {
      key: key,
      rememberSalt: rememberSalt,
      expires: new Date().addDays(15), // TODO this should be configurable
      rememberCookie: Utils.encodeRememberToken(rememberSalt, key)
    };
    ClientSessions.update(this.clientSession._id, { $set: rememberValues });
  },

  // Forget all about the current session
  forgetClientSession: function() {
    SessionHelpers.clearSession(this.clientSession._id);
  },
  
  // The client will call back after it receives a new key
  // so we know it's safe to delete it
  invalidateKey: function(key) {
    ClientSessionKeys.update({ key: key }, {
      $set: {
        deletedAt: new Date()
      }
    });
  }
});
