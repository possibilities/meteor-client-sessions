// Setup collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions');
Secure.noDataMagic('clientSessionKeys');

// Add useful class methods to ClientSession
_.extend(ClientSession, {

  // Find or create a session
  createOrRestore: function(cookies) {
    var clientSessionId;
    cookies || (cookies = {});

    // If we have cookies try to restore the session
    if (cookies.rememberCookie || cookies.sessionCookie)
      clientSessionId = this.restore(cookies);

    // If we find a session update the key
    if (clientSessionId)
      this.exchangeKey(clientSessionId);

    // If no session make one
    else
      clientSessionId = this.create();

    return clientSessionId;
  },

  // Make a session
  create: function() {
    
    // Make a new session
    var clientSessionId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    
    // Get a new key
    this.exchangeKey(clientSessionId);

    return clientSessionId;
  },

  // Find a session via cookies
  restore: function(cookies) {
    var sessionKey, sessionKeyId;

    // If we have cookies figure out the session Id
    if (cookies.sessionCookie)
      sessionKeyId = cookies.sessionCookie;

    // If we're working with a remember me cookie decode it
    else
      sessionKeyId = Utils.decodeRememberToken(cookies.rememberCookie);

    // We found a session key ID, use to get the actual session key
    if (sessionKeyId) {
      sessionKey = ClientSessionKeys.findOne(sessionKeyId);
      if (sessionKey) {
        if (ClientSessions.find(sessionKey.clientSessionId).count() > 0) {
          return sessionKey.clientSessionId;
        }
      }
    }
    
  }, 
  
  // Trash it!
  clear: function(clientSessionId) {
    
    // Make a new key for the session
    this.createKey(clientSessionId);
    
    // Clear or reset all the attributes
    ClientSessions.update(clientSessionId, {
      $unset: {
        rememberCookie: true,
        expires: true
      },
      $set: {
        createdAt: new Date(),
        client: {}
      }
    });
  },

  // Make a new key for the current session
  createKey: function(clientSessionId) {
    
    // Get a new key for the current session
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      clientSessionId: clientSessionId
    });
  },

  // Exchange the session key for a new one
  exchangeKey: function(clientSessionId) {
    
    // Get a new key for the session
    this.createKey(clientSessionId);

    // Now update the key attribute of the session
    ClientSessions.update(clientSessionId, {
      $set: { keyUpdatedAt: new Date() }
    });

  }
});

Meteor.publish('clientSessions', function(cookies) {
  var self = this;
  var uuid = Meteor.uuid();

  // Find or make a client session
  var clientSessionId = ClientSession.createOrRestore(cookies);

  // Prepare client session for publishing to client
  var prepareClientSession = function(clientSession) {

    // Get the latest session key to sync to the server
    var clientSessionKey = ClientSessionKeys.findOne({ clientSessionId: clientSessionId }, { sort: { createdAt: -1 } });

    // If we have a key go ahead and prepare the session for
    // syncing to the client
    if (clientSessionKey) {
      var clientSessionKey = clientSessionKey._id;

      return {
        key:             clientSessionKey,
        client:          clientSession.client,
        expires:         clientSession.expires,
        rememberCookie:  clientSession.rememberCookie
      };
    }
  };

  // Setup for finding the client's session
  var query = { _id: clientSessionId, deletedAt: null };
  var params = { limit: 1, fields: { rememberSalt: false } };

  // Watch the user's client session and publish relavent
  // bits to the client
  var handle = ClientSessions.find(query, params).observe({

    // This happens once per client when the session is first created,
    // publishes the relavent session info up to the client for the
    // first time
    added: function (clientSession) {

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Sync session to client
      if (clientSession) {
        self.set("clientSessions", uuid, clientSession);
        self.complete();
        self.flush();
      }
    },
    
    // When the session changes it's usually because it is being remembered/forgotten or
    // or values are being added to/removed from the `client` object
    changed: function (clientSession, index, oldClientSession) {

      // Figure out which keys have been deleted and unset them
      var deleteKeys = _.difference(_.keys(oldClientSession), _.keys(clientSession));
      self.unset('clientSessions', uuid, deleteKeys);

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Sync session to client
      if (clientSession) {
        self.set("clientSessions", uuid, clientSession);
        self.flush();
      }
    }
  });

   // Remove data and turn off observe when client unsubs
   self.onStop(function () {
     handle.stop();
     
     // TODO this should clear everything!
     self.unset('clientSessions', uuid, []);
     self.flush();
   });
});

Meteor.methods({
  
  // Get a new key for an established session
  refreshClientSession: function() {
    ClientSession.exchangeKey(this.clientSessionId);
  },
  
  // Remember the session after the browser session is over
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = ClientSession.createKey(this.clientSessionId);
    var config = ClientSession.config();
    var rememberSessionForNDays = config.rememberSessionForNDays;
    var rememberValues = {
      keyUpdatedAt: new Date(), 
      rememberSalt: rememberSalt,
      expires: new Date().addDays(rememberSessionForNDays),
      rememberCookie: Utils.encodeRememberToken(rememberSalt, key)
    };
    ClientSessions.update(this.clientSessionId, { $set: rememberValues });
  },

  // Forget all about the current session
  forgetClientSession: function() {
    ClientSession.clear(this.clientSessionId);
  },
  
  // The client will call back after it receives a new key
  // so we know it's safe to delete it
  invalidateKey: function(clientSessionKey) {
    ClientSessionKeys.update(clientSessionKey, {
      $set: {
        deletedAt: new Date()
      }
    });
  }
});
