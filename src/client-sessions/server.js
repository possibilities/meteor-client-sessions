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
        expires: true,
      },
      $set: {
        key: key,
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

  invalidateKey: function(keyId) {
    
  },

  updateKeyForSession: function(clientId) {
    var key = this.createKeyForSession(clientId);
    ClientSessions.update(clientId, {
      $set: { key: key }
    });
  }
};

Meteor.publish('clientSessions', function(client) {
  var self = this;
  var clientId = SessionHelpers.createOrRestoreSession(client);
  var clientSesssionQuery = ClientSessions.find({ _id: clientId, deletedAt: null }, { limit: 1, fields: { rememberSalt: false } });
  var uuid = Meteor.uuid();

  var prepareClientSession = function(raw) {
    var clientSession = {
      client: raw.client,
      key: raw.key,
      rememberCookie: raw.rememberCookie,
      expires: raw.expires
    };

    return clientSession;
  };

  var handle = clientSesssionQuery.observe({

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
  refreshClientSession: function() {
    SessionHelpers.updateKeyForSession(this.clientSession._id);
  },
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = SessionHelpers.createKeyForSession(this.clientSession._id);
    var rememberValues = {
      key: key,
      rememberSalt: rememberSalt,
      expires: new Date().addDays(15),
      rememberCookie: Utils.encodeRememberToken(rememberSalt, key)
    };
    ClientSessions.update(this.clientSession._id, { $set: rememberValues });
  },
  forgetClientSession: function() {
    SessionHelpers.clearSession(this.clientSession._id);
  }
});
