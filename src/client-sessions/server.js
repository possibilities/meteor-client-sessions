// Setup collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions');
Secure.noDataMagic('clientSessionKeys');

// Add instance methods to ClientSession
_.extend(ClientSession.prototype, {

  // Trash it!
  clear: function() {
    
    // Make a new key for the session
    this.createKey();
    
    // Clear or reset all the attributes
    ClientSessions.update(this._id, {
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
  createKey: function() {
    
    // Get a new key for the current session
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      clientSessionId: this._id
    });
  },

  // Exchange the session key for a new one
  exchangeKey: function() {

    //TODO Debounce (or is it throttle?) this method

    // Get a new key for the session
    this.createKey();

    // Now update the key attribute of the session
    ClientSessions.update(this._id, {
      $set: { keyUpdatedAt: new Date() }
    });

  }
});

// Add class methods to ClientSession
_.extend(ClientSession, {

  // Find or create a session
  createOrRestore: function(cookies) {
    var clientSession;
    cookies || (cookies = {});

    // If we have cookies try to restore the session
    if (cookies.rememberCookie || cookies.sessionCookie)
      clientSession = this.restore(cookies);

    // If no session make one
    if (!clientSession)
      clientSession = this.create();

    // Either way generate key
    clientSession.exchangeKey();

    return clientSession;
  },

  // Make a session
  create: function() {
    
    // Make a new session
    var clientSession = {
      createdAt: new Date(),
      client: {}
    };

    ClientSessions.insert(clientSession);

    return new ClientSession(clientSession);
  },

  // Find a session via cookies
  restore: function(cookies) {
    var clientSession, sessionKey, sessionKeyId;

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
        clientSession = ClientSessions.findOne(sessionKey.clientSessionId);
        if (clientSession) {
          return new ClientSession(clientSession);
        }
      }
    }
    
  }, 

  _schedule: {},

  stopScheduledTasks: function(clientSessionId) {
    
    // Stop exchanging the key periodically
    if (this._schedule[clientSessionId]) {
     Meteor.clearInterval(this._schedule[clientSessionId]);
      delete this._schedule[clientSessionId];
    }
  },

  startScheduledTasks: function(clientSessionId) {
    var self = this;
    var config = ClientSession.config();

    // Exchange the session key periodically
    if (!this._schedule[clientSessionId])
      this._schedule[clientSessionId] = Meteor.setInterval(function() {
        self.exchangeKey();
      }, config.exchangeKeyEveryNSeconds * 1000);
  }

});

Meteor.publish('clientSessions', function(cookies) {
  var self = this;
  var subscriptionId = Meteor.uuid();

  // Find or make a client session
  var clientSession = ClientSession.createOrRestore(cookies);
  var clientSessionId = clientSession._id;

  // Periodically exchange the session key
  ClientSession.startScheduledTasks(clientSessionId);

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
  var observeClientSessions = ClientSessions.find(query, params).observe({

    // This happens once per client when the session is first created,
    // publishes the relavent session info up to the client for the
    // first time
    added: function (clientSession) {

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Sync session to client
      if (clientSession) {
        self.set("clientSessions", subscriptionId, clientSession);
        self.complete();
        self.flush();
      }
    },
    
    // When the session changes it's usually because it is being remembered/forgotten or
    // or values are being added to/removed from the `client` object
    changed: function (clientSession, index, oldClientSession) {

      // Figure out which keys have been deleted and unset them
      var deleteKeys = _.difference(_.keys(oldClientSession), _.keys(clientSession));
      self.unset('clientSessions', subscriptionId, deleteKeys);

      // Clean session up before publishing
      clientSession = prepareClientSession(clientSession);

      // Sync session to client
      if (clientSession) {
        self.set("clientSessions", subscriptionId, clientSession);
        self.flush();
      }
    }
  });

  // Remove data and turn off observe when client unsubs
  self.onStop(function () {
  
    // Stop watching client session
    observeClientSessions.stop();
    
    // Stop doing whatever we've scheduled
    ClientSession.stopScheduledTasks(clientSessionId);

    // Clear the published collection and flush to the client
    // TODO this should clear everything!
    self.unset('clientSessions', subscriptionId, []);
    self.flush();
  });
});

Meteor.methods({
  
  // Get a new key for an established session
  refreshClientSession: function() {
    this.clientSession.exchangeKey();
  },
  
  // Remember the session after the browser session is over
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = this.clientSession.createKey();
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
    this.clientSession.clear();
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
