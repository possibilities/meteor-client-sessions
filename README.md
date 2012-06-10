# Client Sessions for Meteor

A smart package for tracking clients across requests

[Check out the demo!](http://client-sessions.meteor.com/)

## Usage

I'll add instructions eventually. Until then check out demo app in repo.

## Security recommendations

If you're implementing authentication on top of `meteor-client-sessions` [OWASP](https://www.owasp.org) has 'cheat sheets' that are a great resource and jumping off point for learning about security best practices. See the references section below. Some things that `meteor-client-sessions` can help with but doesn't (can't¿) enforce:

1. Do everything over HTTPS! If you do we set the `secure` attribute on your cookies.

2. The library exchanges/invalidates client session keys on a schedule (<- TODO) and whenever the page is refreshed but OWASP recommends renewing the session key after any privilege level change. See [Renew the Session ID After Any Privilege Level Change](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet#Renew_the_Session_ID_After_Any_Privilege_Level_Change). You can do this in your code like this:

        Meteor.call('refreshClientSession');

3. If you're only hosting one application per host the defaults should be good. See OWASP's [Domain and Path Attributes](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet#Domain_and_Path_Attributes) if you're setting the cookie's path or domain through `ClientSession.config()`.

## Running the demo

1. Make sure you have Meteor installed
2. From bash, launch **./bin/install-dependencies.sh** and follow instructions
3. cd to the demo folder, run **meteor**

## TODO

Add an endpoint that can delete expired sessions, find nice way to schedule

Some actions hit `changed` twice, look into it and make sure we're not exchanging the key twice

Can we offer different cookie keys pre and post auth? See the end of this [Renew the Session ID After Any Privilege Level Change](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet#Renew_the_Session_ID_After_Any_Privilege_Level_Change)

## References

[https://www.owasp.org/index.php/Session_Management_Cheat_Sheet](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet)

[https://www.owasp.org/index.php/Authentication_Cheat_Sheet](https://www.owasp.org/index.php/Authentication_Cheat_Sheet)

[https://www.owasp.org/index.php/Transport_Layer_Protection_Cheat_Sheet](https://www.owasp.org/index.php/Transport_Layer_Protection_Cheat_Sheet)

[http://www.isecpartners.com/files/web-session-management.pdf](http://www.isecpartners.com/files/web-session-management.pdf)


## Credits

Thanks to [Olivier Refalo](https://github.com/orefalo) ([@orefalo](@orefalo)) for his pull requests and input!
