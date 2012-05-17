ClientSessions = new Meteor.Collection('clientSessions');

var ClientSessionConfig = function(options) {
  var defaultSessionKey = '_meteor_session_id';
  var defaultRememberKey = '_remember_me' + defaultSessionKey;
  var defaultOptions = {
    sessionKey: defaultSessionKey,
    rememberKey: defaultRememberKey,
  };
  _.extend(this, defaultOptions, options);
};

var clientSessionConfig = new ClientSessionConfig();

Meteor.subscribe("clientSessionFeed", {
  sessionCookie: Cookie.get(clientSessionConfig.sessionKey),
  rememberCookie: Cookie.get(clientSessionConfig.rememberKey)
});

Meteor.autosubscribe(function() {
  var clientSession = ClientSessions.findOne();
  if (clientSession) {

    // Save a session cookie
    if (clientSession.latestKey) {
      Cookie.set(clientSessionConfig.sessionKey, clientSession.latestKey);
    } else {
      Cookie.remove(clientSessionConfig.sessionKey);
    }
    
    // Save remember me cookie
    var expires = new Date(clientSession.rememberedAt).addDays(clientSession.rememberForNDays);
    if (clientSession.rememberCookie) {
      Cookie.set(clientSessionConfig.rememberKey, clientSession.rememberCookie, {
        expires: expires
      });
    } else {
      Cookie.remove(clientSessionConfig.rememberKey);
    }
  }
});
