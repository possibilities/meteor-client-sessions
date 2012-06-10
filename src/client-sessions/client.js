// A local collection to hold onto the current clientSession
ClientSessions = new Meteor.Collection('clientSessions');

// Subscribe to clientSessions
Meteor.subscribe('clientSessions', {
  var config = ClientSession.config();

  // Resume session using cookies if they're present.
  sessionCookie: Cookie.get(config.sessionCookieName),
  rememberCookie: Cookie.get(config.rememberCookieName)

// When the subscriptions completes emit ready event
}, function onClientSessionComplete() {
  ClientSession.trigger('ready');
});

// Use an autosubscription to keep track of changes to the clientSession
Meteor.autosubscribe(function() {
  
  // Lookup the current client session
  var clientSession = ClientSessions.findOne();
  if (clientSession) {

    // Emit change event when the session changes
    if (ClientSession._previousKey)
      ClientSession.trigger('change');
    
    var secure = window.location.protocol === 'https:';
    var config = ClientSession.config();
      
    // Make sure we have a session key
    if (clientSession.key) {
      
      // Detect clientSession key changes
      if (ClientSession._previousKey !== clientSession.key) {
        
        // If it's a legit key change invalidate the old key
        if (ClientSession._previousKey)
          Meteor.call('invalidateKey', ClientSession._previousKey);
        
        // Keep track of previous session key so we can detect changes
        ClientSession._previousKey = clientSession.key;
      }
      
      // Save session cookie
      var cookieOptions = {
        httpOnly: true,
        secure: secure,
        cookiePath: config.cookiePath,
        cookieDomain: config.cookieDomain
      };
      Cookie.set(config.sessionCookieName, clientSession.key, cookieOptions);
    }

    // Trash remember cookie
    else
      Cookie.remove(config.sessionCookieName);
    
    // Save remember cookie
    if (clientSession.rememberCookie)
      Cookie.set(config.rememberCookieName, clientSession.rememberCookie, {
        expires: clientSession.expires,
        secure: secure
      });

    // Trash session cookie
    else
      Cookie.remove(config.rememberCookieName);
  }
});
