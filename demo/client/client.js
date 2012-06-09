(function() {

// Plumbing

_.mixin(_.string.exports());

// Template methods

Template.demo.clientId = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return session.key;
  }
};

Template.demo.userName = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return new ClientSession(session).get('userName');
  }
};

Template.demo.rememberUntil = function() {
  var session = ClientSessions.findOne();
  if (session && session.expires) {
    return moment(session.expires).fromNow();
  }
};

Template.demo.successMessage = function() {
  return Session.get('successMessage');
};

Template.demo.userForm = function() {
  return userForm.create().render();
};

// Tools & tricks

ClientSessionHelpers = {
  updateUserName: function() {
    var $nameElement = $('#userName');
    var name = $nameElement.attr('value');
    if (!_.isBlank(name)) {
      var clientSession = ClientSessions.findOne();
      if (clientSession) {
        Meteor.call('updateUserName', name);
        $nameElement.attr('value', '');
        Session.set('successMessage', 'Nice, you added your name to your session!');
      }
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
    Cookie.remove(clientSessionConfig.sessionKey);
    Cookie.remove(clientSessionConfig.rememberKey);
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
  userForm.show().render();
  focusOnUserName();
}).on('change', function() {
  focusOnUserName();
});

// Deal with fading out success message
Meteor.autosubscribe(function() {
  if (Session.get('successMessage')) {
    ClientSessionHelpers.successFadeOutAfter(7000);
    $('#userName').focus();
  } 
});

})();
