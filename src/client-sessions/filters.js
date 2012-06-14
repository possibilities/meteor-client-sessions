
ClientSessionFilters = {

  // Prepend client session info to `Meteor.call/apply` arguments
  dumpSession: function() {
    var clientSession;
    var argumentsArray = _.toArray(arguments);

    // Make sure we have a session
    if (clientSession = ClientSessions.findOne()) {

      // Prepend the session info to `Meteor.call/apply` 
      // arguments, they'll be verified by a server
      // side filter
      argumentsArray.unshift(clientSession.key);
      
      // Return the arguments untampered
      return argumentsArray;
    }
      
    // If all else fails use null
    argumentsArray.unshift(null);
    return argumentsArray;
  },

  // Unload and verify client session info for `Meteor.methods`
  loadSession: function() {
    if (this.is_simulation)
      return;

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
