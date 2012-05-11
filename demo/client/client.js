// Plumbing

_.mixin(_.string.exports());

// Template methods

Template.demo.sessionId = function() {
  var session = UserSessions.findOne();
  if (session) {
    return session._id;
  }
};

Template.demo.userName = function() {
  var session = UserSessions.findOne();
  if (session) {
    return session.userName;
  }
};

Template.demo.rememberUntil = function() {
  var session = UserSessions.findOne();
  if (session && session.rememberedAt) {
    var until = new Date(session.rememberedAt).addDays(session.rememberForNDays);
    return moment(until).fromNow();
  }
};

Template.demo.successMessage = function() {
  return Session.get('successMessage');
};

// Tools & tricks

UserSessionHelpers = {
  setUserName: function() {
    var $nameElement = $('#setUserNameInput');
    var name = $nameElement.attr('value');
    if (!_.isBlank(name)) {
      Meteor.call('setUserName', name);
      $nameElement.attr('value', '');
      Session.set('successMessage', 'Nice, you added your name to your session!');
    }
  },
  submitOnEnterKey: function(e) {
    if (e.keyCode === 13) {
      UserSessionHelpers.setUserName();
    }
  },
  successFadeOutAfter: function(afterSeconds) {
    if (this.timeoutId) Meteor.clearTimeout(this.timeoutId);
    this.timeoutId = Meteor.setTimeout(function() {
      $('#successMessage').fadeOut('fast', function() {
        if (!this.timeoutId) Session.set('successMessage');
      });
    }, afterSeconds);
  }
};


// Events

Template.demo.events = {
  'click #refreshUserSession': function() {
    userSession.refresh();
    Session.set('successMessage', 'Kool, your session is being refreshed! You should get a new session ID but if you set your name below it will be remembered.');
  },
  'click #rememberUserSession': function() {
    userSession.remember();
    Session.set('successMessage', "Awesome, we'll remember your session even if you close your browser.");
  },
  'click #forgetUserSession': function() {
    if (userSession.isRemembered()) {
      userSession.forget(false);
      Session.set('successMessage', "We'll forget who you are after this session!");
    } else {
      Session.set('successMessage', "You didn't tell us to remember you, so we won't!");
    }
  },
  'click #forgetUserSessionNow': function() {
    userSession.forget();
    Session.set('successMessage', "Who are you again?");
  },
  'click #setUserNameButton': UserSessionHelpers.setUserName,
  'keydown #setUserNameInput': UserSessionHelpers.submitOnEnterKey,
};

// Subscriptions

Meteor.autosubscribe(function() {
  // Deal with fading out success message some time after it's displayed
  if (Session.get('successMessage')) {
    $('#setUserNameInput').focus();
    UserSessionHelpers.successFadeOutAfter(7000);
  } 
});
