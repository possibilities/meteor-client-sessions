Meteor.methods({
  setUserName: function(userName) {
    var session = ClientSessions.findOne(this.sessionId);
    if (session) {
      session.set('userName', userName);
    }
  }
});

// Delete everything when the demo starts

ClientSessions.remove({});
ClientSessionKeys.remove({});
