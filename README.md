# Client Sessions for Meteor

A smart package for tracking clients across requests

[Check out the demo!](http://client-sessions.meteor.com/)

## Installation

I'm not sure if people will add this to their app... instead it'll be a dependency when you're writing an authorization system (that's why I wrote this!). But if you just want to keep track of users and aren't concerned about having them log in it can be installed like any smart package.

First download it and add it to your Meteor packages.

Now add it to your app

    meteor add client-sessions

## Usage

I'll add instructions eventually. Until then check out demo app in repo.

## TODO

Invalidate keys whenever possible!

We're stomping on the the context that Meteor gives to Meteor.methods, fix this!

Add an endpoint that can delete expired sessions, find nice way to schedule
