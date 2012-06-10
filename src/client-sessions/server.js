// Setup collections
ClientSessions = new Meteor.Collection('clientSessions');
ClientSessionKeys = new Meteor.Collection('clientSessionKeys');

// Lock that shit down
Secure.noDataMagic('clientSessions');
Secure.noDataMagic('clientSessionKeys');

_.extend(ClientSession, {

  // Find or create a session
  createOrRestoreSession: function(cookies) {
    var clientId;
    cookies || (cookies = {});

    // If we have cookies try to restore the session
    if (cookies.rememberCookie || cookies.sessionCookie)
      clientId = this.restoreSession(cookies);

    // If we find a session update the key
    if (clientId)
      this.updateKeyForSession(clientId);

    // If no session make one
    else
      clientId = this.createSession();

    return clientId;
  },

  // Make a session
  createSession: function() {
    
    // Make a new session
    var clientId = ClientSessions.insert({
      createdAt: new Date(),
      client: {}
    });
    
    // Get a new key
    this.updateKeyForSession(clientId);

    return clientId;
  },

  // Find a session via cookies
  restoreSession: function(cookies) {
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
        if (ClientSessions.find(sessionKey.clientId).count() > 0) {
          return sessionKey.clientId;
        }
      }
    }
    
  }, 
  
  // Trash it!
  clearSession: function(clientId) {
    
    // Make a new key for the session
    var key = this.createKeyForSession(clientId);
    
    // Clear or reset all the attributes
    ClientSessions.update(clientId, {
      $unset: {
        rememberCookie: true,
        expires: true
      },
      $set: {
        key: key,
        createdAt: new Date(),
        client: {}
      }
    });
  },

  // Make a new key for the current session
  createKeyForSession: function(clientId) {
    
    // Get a new key for the current session
    return ClientSessionKeys.insert({
      createdAt: new Date(),
      clientId: clientId
    });
  },

  // Make and attach a new key to the current session
  updateKeyForSession: function(clientId) {
    
    // Get a new key for the session
    var key = this.createKeyForSession(clientId);

    // Now update the key attribute of the session
    ClientSessions.update(clientId, {
      $set: { key: key }
    });

  }
});

Meteor.publish('clientSessions', function(cookies) {
  var self = this;
  var uuid = Meteor.uuid();

  // Find or make a client session
  var clientId = ClientSession.createOrRestoreSession(cookies);

  // Prepare client session for publishing to client
  var prepareClientSession = function(clientSession) {
    return {
      client:          clientSession.client,
      key:             clientSession.key,
      rememberCookie:  clientSession.rememberCookie,
      expires:         clientSession.expires
    };
  };

  // Setup for finding the client's session
  var query = { _id: clientId, deletedAt: null };
  var params = { limit: 1, fields: { rememberSalt: false } };

  // Watch the user's client session and publish relavent
  // bits to the client
  var handle = ClientSessions.find(query, params).observe({

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
     
     // TODO this should clear everything!
     self.unset('clientSessions', uuid, []);
     self.flush();
   });
});

Meteor.methods({
  
  // Get a new key for an established session
  refreshClientSession: function() {
    ClientSession.updateKeyForSession(this.clientSession._id);
  },
  
  // Remember the session after the browser session is over
  rememberClientSession: function() {
    var rememberSalt = Meteor.uuid();
    var key = ClientSession.createKeyForSession(this.clientSession._id);
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
    ClientSession.clearSession(this.clientSession._id);
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
