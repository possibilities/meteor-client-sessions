// Client kickoff

Meteor.call('userSessionInternalMethods', function(err, userSessionInternalMethods) {
  if (!err) {

    // Apply client filters to Meteor.call/Meteor.apply
    Filter.methods([
      UserSession.injectSessionToRemoteMethodCalls, {
        except: userSessionInternalMethods
      }
    ]);

    // Start the session
    userSession.start();
  }
});
