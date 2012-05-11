// Collection

UserSessions = new Meteor.Collection('userSessions');

// Secure collections

Secure.noDataMagic('userSessions');

// Utils

Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + days);
  return this;
}
