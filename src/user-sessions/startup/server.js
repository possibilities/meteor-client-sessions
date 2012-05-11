// Server kickoff

Meteor.startup(function() {

  // Apply server filters to applicable methods
  Filter.methods([
    {
      handler: UserSession.loadSessionFromRemoteMethodCalls,
      except: Meteor.call('userSessionInternalMethods')
    }
  ]);
});
