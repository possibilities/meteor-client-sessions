// Prepend sessionId to server method call arguments

UserSession.injectSessionToRemoteMethodCalls = function() {
  var argumentsArray = _.toArray(arguments);
  var session = UserSessions.findOne();
  if (session) {
    var sessionId = session._id;
    if (sessionId) {
      argumentsArray.unshift(sessionId);
    }
  }
  return argumentsArray;
};
