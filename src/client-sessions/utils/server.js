var crypto = __meteor_bootstrap__.require('crypto');

Utils = {};

Utils.cloneSession = function(object) {
  var cloned = _.clone(object);
  delete cloned._id;
  return cloned;
};

Utils.cloneSessionForClient = function(object) {
  var cloned = this.cloneSession(object);
  var sensitiveKeys = ['rememberSalt'];
  return _.reduce(cloned, function(nonSensitiveValues, val, key) {
    if (!_.contains(sensitiveKeys, key)) {
      nonSensitiveValues[key] = val;
    }
    return nonSensitiveValues;
  }, {});
};

Utils.encodeRememberToken = function(rememberSalt, rememberToken) {
  var encodedToken = rememberToken + '--' + this.generateHmac(rememberSalt, rememberToken);
  return encodedToken;
};

Utils.decodeRememberToken = function(encodedRememberToken) {
  var tokenParts = encodedRememberToken.split('--');
  var rememberToken = _.first(tokenParts);
  var digest = _.last(tokenParts);
  var key = ClientSessionKeys.findOne(rememberToken);
  if (key) {
    var session = ClientSessions.findOne(key.sessionId);
    var hash = Utils.generateHmac(session.rememberSalt, rememberToken);
    if (hash === digest) {
      return key._id;
    }
  }
};

Utils.generateHmac = function(rememberSalt, rememberToken) {
  return crypto.createHmac('sha1', rememberSalt).update(rememberToken).digest('hex');
};
