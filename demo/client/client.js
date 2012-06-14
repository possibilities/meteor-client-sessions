(function() {

// Plumbing

_.mixin(_.string.exports());

// Template methods

Template.demo.clientSessionId = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return session.key;
  }
};

var userName = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return new ClientSession(session).get('userName');
  }
};

Template.demo.userName = userName;
Template.userNameDemo.userName = userName;

Template.demo.rememberUntil = function() {
  var session = ClientSessions.findOne();
  if (session && session.expires) {
    return moment(session.expires).fromNow();
  }
};

Template.demo.successMessage = function() {
  return Session.get('successMessage');
};

Template.userNameDemo.userForm = function() {
  return userForm.show().render();
};

Meteor.defer(function() {
  userForm.on('success', function() {
    var session = ClientSessions.findOne();
    if (session) {
      var userName = new ClientSession(session).get('userName');
      userForm.edit(userForm.currentValues);
    }
  });
});

// Tools & tricks

DemoHelpers = {
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
  'click #refreshClientSession': function() {
    Meteor.call('refreshClientSession');
    Session.set('successMessage', 'Kool, your session is being refreshed! You should get a new session ID but if you set your name below it will be remembered.');
  },
  'click #rememberClientSession': function() {
    var clientSession = ClientSessions.findOne();
    if (clientSession) {
      Meteor.call('rememberClientSession');
    }
    Session.set('successMessage', "Awesome, we'll remember your session even if you close your browser.");
  },
  'click #forgetClientSession': function() {
    var clientSession = ClientSessions.findOne();
    if (clientSession) {
      Meteor.call('forgetClientSession');
    }
    Session.set('successMessage', "Who are you again?");
  },
  'click #deleteCookies': function() {
    var config = ClientSession.config();
    Cookie.remove(config.sessionCookieName);
    Cookie.remove(config.rememberCookieName);
    Session.set('successMessage', "Yum, I ate your cookies¡!");
  }
};

// Helper for focusing on the form field
var focusOnUserName = function() {
  Meteor.defer(function() {
    $('#user_name').focus();
  });
};

// Keep form focused
ClientSession.on('ready', function() {
  focusOnUserName();
}).on('change', function() {
  focusOnUserName();

  // Fade out the form alert
  // TODO this should be handled by the form library
  if (this.timeoutId) Meteor.clearTimeout(this.timeoutId);
  this.timeoutId = Meteor.setTimeout(function() {
    $('.formWrapper .alert').fadeOut('fast', function() {
      if (!this.timeoutId) Session.set('successMessage');
    });
  }, 5000);
  
});

// Deal with fading out success message
Meteor.autosubscribe(function() {
  if (Session.get('successMessage')) {
    DemoHelpers.successFadeOutAfter(5000);
  } 
});

})();
