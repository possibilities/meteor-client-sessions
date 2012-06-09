ClientSessions = new Meteor.Collection('clientSessions');

// Subscribe to clientSessions
Meteor.subscribe('clientSessions', {

  // Resume session using cookies if they're present.
  sessionCookie: Cookie.get(ClientSession.config().sessionKey),
  rememberCookie: Cookie.get(ClientSession.config().rememberKey)

// When the subscriptions completes emit ready event
}, function onClientSessionComplete() {
  ClientSession.trigger('ready');
});

// Use an autosubscription to keep track of changes to the clientSession
Meteor.autosubscribe(function() {
  var clientSession = ClientSessions.findOne();

  if (clientSession) {

    // Emit change event when the session changes
    if (ClientSession._previousKey)
      ClientSession.trigger('change');

    if (clientSession.key) {
      if (ClientSession._previousKey !== clientSession.key) {
        
        // If it's a legit key change invalidate the old key
        if (ClientSession._previousKey)
          Meteor.call('invalidateKey', ClientSession._previousKey);
        
        // Keep track of previous session key so we can detect changes
        ClientSession._previousKey = clientSession.key;
      }
      
      // Save session cookie
      Cookie.set(ClientSession.config().sessionKey, clientSession.key);
    }

    // Trash remember cookie
    else
      Cookie.remove(ClientSession.config().sessionKey);
    
    // Save remember cookie
    if (clientSession.rememberCookie)
      Cookie.set(ClientSession.config().rememberKey, clientSession.rememberCookie, {
        expires: clientSession.expires
      });

    // Trash session cookie
    else
      Cookie.remove(ClientSession.config().rememberKey);
  }
});
