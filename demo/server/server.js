Meteor.methods({
  setUserName: function(userName) {
    var session = UserSessions.findOne(this.sessionId);
    if (session) {
      UserSessions.update(this.sessionId, { $set: { userName: userName } });;
    }
  }
});
