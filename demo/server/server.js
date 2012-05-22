Meteor.methods({
  setUserName: function(userName) {
    var session = ClientSessions.findOne(this.clientId);
    if (session) {
      session.set('userName', userName);
    }
  }
});

// Delete everything when the demo starts

ClientSessions.remove({});
ClientSessionKeys.remove({});
