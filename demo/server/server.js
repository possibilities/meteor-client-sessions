Users = new Meteor.Collection('users');
Secure.noDataMagic();

Meteor.methods({
  saveUser: function(user) {
    this.clientSession.set('userName', user.name);

    if (this.is_simulation) return user;
  }
});
