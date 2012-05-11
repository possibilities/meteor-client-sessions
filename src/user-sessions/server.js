var crypto = __meteor_bootstrap__.require('crypto');

// API

UserSession = function() {
  this.defaultFields = {
    previousSessionId: false,
    rememberSalt: false
  };
  this.defaultSelector = {
    deletedAt: null,
  };

  this._setupRemoteMethods();
  this._respondToSubscriptions();
};

UserSession.prototype._setupRemoteMethods = function() {
  var self = this;

  Meteor.methods({
    createUserSession: function() {
      var newSession = {
        createdAt: new Date()
      };
      var sessionId = UserSessions.insert(newSession);
      return sessionId;
    },
    
    refreshUserSession: function(previousSessionId) {
      var previousSession, newSession, newSessionId;
      if (previousSession = UserSession.forSessionId(previousSessionId)) {
        // Clone the old session and get rid of the ID
        newSession = _.clone(previousSession);
        delete newSession._id;
        // Mark the new session with the previous sessionId
        newSession.previousSessionId = previousSessionId;
        // Insert the new
        newSessionId = UserSessions.insert(newSession);
        // Delete the old one
        var deleteValues = {
          $set: { deletedAt: new Date() },
          $unset: { rememberToken: 1 }
        };
        UserSessions.update(previousSessionId, deleteValues);
        return newSessionId;
      } else {
        return Meteor.call('createUserSession');
      }
    },
    userSessionFromToken: function(signedRememberToken) {
      if (signedRememberToken) {
        var tokenParts = signedRememberToken.split('--');
        var rememberToken = _.first(tokenParts);
        var digest = _.last(tokenParts);
        var session = UserSessions.findOne({ rememberToken: rememberToken });
        if (session) {
          var hash = self._generateHmac(session.rememberSalt, rememberToken);
          if (hash === digest) {
            return Meteor.call('rememberUserSession', session._id);          
          }
        }
      }
      return Meteor.call('createUserSession');
    },
    rememberUserSession: function(sessionId) {
      var session = UserSessions.findOne(sessionId);
      if (session) {
        var rememberToken = Meteor.uuid();
        var rememberSalt = Meteor.uuid();
        var rememberValues = {
          rememberToken: rememberToken,
          rememberSalt: rememberSalt,
          rememberedAt: new Date(),
          rememberForNDays: 15,
          rememberCookie: self._generateCookie(rememberSalt, rememberToken)
        };
        UserSessions.update(sessionId, { $set: rememberValues });
        return sessionId;
      }
    },
    forgetUserSession: function(sessionId, immediately) {
      var session = UserSessions.findOne(sessionId);
      if (session) {
        var unsetValues = {
          rememberToken: 1,
          rememberSalt: 1,
          rememberedAt: 1,
          rememberForNDays: 1
        };
        var setValues = {};
        if (immediately) {
          setValues.deletedAt = new Date();
        }
        UserSessions.update(sessionId, { $set: setValues, $unset: unsetValues });
        return sessionId;
      }
    },
    userSessionInternalMethods: function() {
      var isDataRoute = /^\/\w*\/(insert|update|remove)$|^.*tinytest.*$/i;

      var internalMethods = [
        'createUserSession',
        'refreshUserSession',
        'userSessionFromToken',
        'rememberUserSession',
        'forgetUserSession',
        'userSessionInternalMethods'
      ];
      var allMeteorMethods = _.keys(Meteor.default_server.method_handlers);
      _.each(allMeteorMethods, function(methodName) {
        if (isDataRoute.test(methodName)) {
          internalMethods.push(methodName);
        }
      });
      return internalMethods;
    }
  });
};

UserSession.prototype._respondToSubscriptions = function() {
  var self = this;
  Meteor.publish('userSessions', function(sessionId) {
    var selector = _.extend(_.clone(self.defaultSelector), {
      _id: sessionId
    });
    return UserSessions.find(selector, { fields: self.defaultFields });
  });
};

UserSession.prototype._generateHmac = function(rememberSalt, rememberToken) {
  return crypto.createHmac('sha1', rememberSalt).update(rememberToken).digest('hex');
};

UserSession.prototype._generateCookie = function(rememberSalt, rememberToken) {
  return rememberToken + '--' + this._generateHmac(rememberSalt, rememberToken);
};

// Class methods

UserSession.forSessionId = function(sessionId) {
  if (sessionId) {
    return UserSessions.findOne(sessionId);
  }
};
