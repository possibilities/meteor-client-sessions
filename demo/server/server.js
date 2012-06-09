Users = new Meteor.Collection('users');
Secure.noDataMagic();

Meteor.methods({
  saveUser: function(user) {
    this.clientSession.set('userName', user.name);
  }
});
