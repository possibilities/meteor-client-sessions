// Plumbing

_.mixin(_.string.exports());

// Template methods

Template.demo.clientId = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return session.latestKey;
  }
};

Template.demo.userName = function() {
  var session = ClientSessions.findOne();
  if (session) {
    return session.get('userName');
  }
};

Template.demo.rememberUntil = function() {
  var session = ClientSessions.findOne();
  if (session && session.rememberedAt) {
    var until = new Date(session.rememberedAt).addDays(session.rememberForNDays);
    return moment(until).fromNow();
  }
};

Template.demo.successMessage = function() {
  return Session.get('successMessage');
};

// Tools & tricks

ClientSessionHelpers = {
  setUserName: function() {
    var $nameElement = $('#setUserNameInput');
    var name = $nameElement.attr('value');
    if (!_.isBlank(name)) {
      var clientSession = ClientSessions.findOne();
      if (clientSession) {
        Meteor.call('setUserName', name);
        $nameElement.attr('value', '');
        Session.set('successMessage', 'Nice, you added your name to your session!');
      }
    }
  },
  submitOnEnterKey: function(e) {
    if (e.keyCode === 13) {
      ClientSessionHelpers.setUserName();
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
  },
  'click #setUserNameButton': ClientSessionHelpers.setUserName,
  'keydown #setUserNameInput': ClientSessionHelpers.submitOnEnterKey,
};

// Subscriptions

Meteor.autosubscribe(function() {
  // Deal with fading out success message some time after it's displayed
  if (Session.get('successMessage')) {
    $('#setUserNameInput').focus();
    ClientSessionHelpers.successFadeOutAfter(7000);
  } 
});

// Get github fork me graphic loaded. Found that client subscriptions sometimes
// don't start if the image is in the DOM from the start.
Meteor.defer(function() {
  $forkMe = $('img.forkMe');
  var src = $forkMe.data('src');
  $forkMe.attr('src', src);
});

Meteor.startup(function() {
  $('#setUserNameInput').focus();
});
