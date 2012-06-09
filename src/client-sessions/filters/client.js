// Prepend client session info to `Meteor.call/apply` arguments

ClientSessionFilters = {
  injectSession: function() {
    var clientSession;
    var argumentsArray = _.toArray(arguments);

    // Make sure we have a session
    if (clientSession = ClientSessions.findOne()) {

      // Prepend the session info to `Meteor.call/apply` 
      // arguments, they'll be verified by a server
      // side filter
      argumentsArray.unshift({
        clientId: clientSession._id,
        key: clientSession.key
      });
      
      // Return the arguments untampered
      return argumentsArray;
    }
      
    // If all else fails prepend an empty obj
    argumentsArray.unshift({});
    return argumentsArray;
  }
};
