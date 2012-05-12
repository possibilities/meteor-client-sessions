# User Sessions for Meteor

A Meteor lib for tracking users across requests

## Installation

I don't think most people will add this to their app... instead it'll be a dependency when you're writing an authorization system (that's why I wrote this!). But if you just want to keep track of users and aren't concerned about having them log in it can be installed like any smart package.

First download it and add it to your Meteor packages.

Now add it to your app

    meteor add user-sessions

## Usage

I'll add instructions eventually. Until then check out demo app in repo.

## TODO

Client stubb for internal methods

Clear stuff add to context by injectSessionToRemoteMethodCalls, but not until after all the middleware has been run (if possible)

Maybe it's possible to use inject/load of session ID on internal methods

Add some acceptance tests to avoid overhead of little changes
