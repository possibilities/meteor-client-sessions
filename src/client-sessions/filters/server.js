// Unload and verify client session info for `Meteor.methods`

ClientSessionFilters = {
  loadSession: function() {
    var key, clientSession;
    var arrayArguments = _.toArray(arguments);
    
    // Get the payload which includes the session id and key
    var payload = arrayArguments.shift();

    // make sure we have a payload
    if (payload.clientId) {
      
      // Make sure the payload key turns up a key from db
      if (key = ClientSessionKeys.findOne(payload.key)) {
        
        // Use the retrieved key to look up the session
        clientSession = ClientSessions.findOne(key.clientId);
        
        // Make sure the correct session is being asked for
        if (key.clientId === payload.clientId) {
          
          // Keep a reference for Meteor.methods
          this.clientSession = new ClientSession(clientSession);
        }
      }
    }

    // Pass on the rest of the args untampered
    return arrayArguments;
  }  
};
