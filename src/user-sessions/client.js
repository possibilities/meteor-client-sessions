// Client Session

UserSession = function(options) {
  var defaultSessionKey = '_meteor_session_id';
  var defaultRememberKey = '_remember_me' + defaultSessionKey;
  var defaultOptions = {
    sessionKey: defaultSessionKey,
    rememberKey: defaultRememberKey,
  };
  
  this.subscriptions = {};
  this.options = _.extend(defaultOptions, options);
};

// API

UserSession.prototype.refresh = function() {
  var self = this;
  Meteor.call('refreshUserSession', self.sessionId, function(err, sessionId) {
    if (!err) {
      self.handleNewSessionId(sessionId);
    }
  });
};

UserSession.prototype.create = function() {
  var self = this;

  // Clear stuff out if need be
  if (Cookie.has(self.options.sessionKey)) {
    Cookie.remove(self.options.sessionKey);
    Cookie.remove(self.options.rememberKey);
  }
  
  Meteor.call('createUserSession', function(err, sessionId) {
    if (!err) {
      self.handleNewSessionId(sessionId);
    }
  });
};

UserSession.prototype.rebuild = function() {
  var self = this;
  var rememberToken = Cookie.get(this.options.rememberKey);
  if (rememberToken) {
    Meteor.call('userSessionFromToken', rememberToken, function(err, sessionId) {
      if (!err && sessionId) {
        self.handleNewSessionId(sessionId);
      }
    });
  }
};

UserSession.prototype.remember = function() {
  var self = this;
  if (self.sessionId) {
    Meteor.call('rememberUserSession', self.sessionId, function(err, sessionId) {
      self.handleNewSessionId(sessionId);
    });
  }
};

UserSession.prototype._setRememberCookie = function(session) {
  var self = this;
  var expires, rememberCookie;

  if (session) {
    expires = new Date(session.rememberedAt).addDays(session.rememberForNDays);
    rememberCookie = session.rememberCookie;
    if (rememberCookie) {
      Cookie.set(self.options.rememberKey, rememberCookie, {
        expires: expires
      });
    }
  }
};

UserSession.prototype.forget = function(immediately) {
  if (_.isUndefined(immediately)) immediately = true;

  // Tell the server
  if (this.sessionId) {
    Meteor.call('forgetUserSession', this.sessionId, immediately);
  }

  // Clear cookies
  if (immediately) {
    Cookie.remove(this.options.sessionKey);
  }
  Cookie.remove(this.options.rememberKey);
};

UserSession.prototype.current = function() {
  return UserSessions.findOne();
};

UserSession.prototype.isRemembered = function() {
  var session = this.current();
  if (session) {
    return !!session.rememberedAt;
  }
};

UserSession.prototype.handleNewSessionId = function(newSessionId) {
  var self = this;
  if (self.sessionId !== newSessionId) {
    self.sessionId = newSessionId;
  }

  // Subscribe to it
  self.subscriptions[self.sessionId] = Meteor.subscribe('userSessions', self.sessionId);

  // Keep track of session methods
  var userSessionInternalMethods = Meteor.call('userSessionInternalMethods', function(err, userSessionInternalMethods) {
    if (!err) {
      self.userSessionInternalMethods = userSessionInternalMethods;
    }
  });

  // Remember it for the session
  Cookie.set(self.options.sessionKey, self.sessionId);
};

UserSession.prototype.start = function() {
  var self = this;

  // React to session changes
  Meteor.autosubscribe(function() {
    var session = self.current();
    
    // We have a session
    if (session && session._id) {
      // Keep remember me cookie up to date
      if (session.rememberToken) {
        self._setRememberCookie(session);
      }
  
    // Build a session from session cookie
    } else if (self.sessionId = Cookie.get(self.options.sessionKey)) {
      self.refresh();
  
    // We have a remember token, dredge up the session
    } else if (Cookie.has(self.options.rememberKey)) {
      self.rebuild();

    // No session, make a new one
    } else {
      self.create();
    }
  });
};
