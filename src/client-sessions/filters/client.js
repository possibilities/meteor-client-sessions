// Prepend clientSessionId to server method call arguments

ClientSessionFilters = {
  injectSession: function() {
    var argumentsArray = _.toArray(arguments);
    var session = ClientSessions.findOne();
    if (session) {
      var clientSessionId = session._id;
      if (clientSessionId) {
        argumentsArray.unshift(clientSessionId);
        return argumentsArray;
      }
    }
      
    // If all else fails prepend null
    argumentsArray.unshift(null);
    return argumentsArray;
  }
};
