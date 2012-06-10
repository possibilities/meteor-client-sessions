// Unload and verify client session info for `Meteor.methods`

ClientSessionFilters = {
  loadSession: function() {
    var key, clientSession;
    var arrayArguments = _.toArray(arguments);
    
    // Get the payload which includes the session id and key
    var keyId = arrayArguments.shift();

    // make sure we have a payload
    if (keyId) {
      
      // Make sure the payload key turns up a key from db
      if (key = ClientSessionKeys.findOne(keyId)) {
        
        // Use the retrieved key to look up the session
        clientSession = ClientSessions.findOne(key.clientSessionId);
        
        // Make sure the correct session is being asked for
        if (clientSession) {
          
          // Keep a reference for Meteor.methods
          this.clientSession = new ClientSession(clientSession);
          // This is also nice to have around
          this.clientSessionId = this.clientSession._id;
        }
      }
    }

    // Pass on the rest of the args untampered
    return arrayArguments;
  }  
};
