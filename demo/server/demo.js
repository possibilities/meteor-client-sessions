Meteor.methods({
  setUserName: function(userName, sessionId) {
    var session = ClientSessions.findOne(sessionId);
    if (session) {
      session.set('userName', userName);
    }
  }
});

// Delete everything when the demo starts

ClientSessions.remove({});
ClientSessionKeys.remove({});
