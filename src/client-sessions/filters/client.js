// Prepend clientId to server method call arguments

ClientSessionFilters = {
  injectSession: function() {
    var argumentsArray = _.toArray(arguments);
    var session = ClientSessions.findOne();
    if (session) {
      var clientId = session._id;
      if (clientId) {
        argumentsArray.unshift(clientId);
        return argumentsArray;
      }
    }
      
    // If all else fails prepend null
    argumentsArray.unshift(null);
    return argumentsArray;
  }
};
