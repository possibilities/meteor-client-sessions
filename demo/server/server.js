Users = new Meteor.Collection('users');
Secure.noDataMagic();

Meteor.methods({
  saveUser: function(user) {
    var session = ClientSessions.findOne(this.clientId);
    session.set('userName', user.name);
  }
});
