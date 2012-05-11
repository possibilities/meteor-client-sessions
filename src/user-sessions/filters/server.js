UserSession.loadSessionFromRemoteMethodCalls = function() {
  var arrayArguments = _.toArray(arguments);
  this.sessionId = arrayArguments.shift();
  return arrayArguments;
};
