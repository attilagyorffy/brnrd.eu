Title: Upcoming OpenSSL vulnerabilities
Tags: SSL, LibreSSL, OpenSSL
Modified: 2016-02-27 12:44:00
Author: Bernard Spil
Image: /img/VulnerabilityAhead.png
Summary: Coming Tuesday (1 March 2016) OpenSSL will release new versions that fix multiple vulnerabilities, at least one of them rated "High". Being curious to see if I need to scramble to patch things up, I dug into the information I could find on these vulnerabilities.

**Disclaimer:** I'm neither a C-programmer nor a cryptographer. This is my personal assessment of the issues and provides no guarantees and comes without any warranty.

Always nice these ominous announcements from OpenSSL: [“Forthcoming OpenSSL releases”](https://mta.openssl.org/pipermail/openssl-announce/2016-February/000063.html). The mail informs us that we may expect new versions for OpenSSL 1.0.1 and 1.0.2 and contains the statement “They will fix several security defects with maximum severity "high".”. This leaves everybody in a state of “How high do I jump?”.

Three of the vulnerabilities can already be found in public sources on the internet, and I've taken a look to see if I can figure out if LibreSSL is vulnerable as well. I'm not going to point you at the locations for the details, but these are trivial to find.

# Good news

The code for two of the three vulnerabilities does not exist in LibreSSL. 

As you (should) know, LibreSSL removed a lot of features prior to the initial release and removed even more in subsequent releases. Next to that some parts of the code that the developers deemed unfit for use had been replaced by code that follows modern security standards in coding.

One of the vulnerabilities was found in code that was [‘flensed’](https://en.wikipedia.org/wiki/Flensing) from the code prior to the initial release, another one was found in code that was replaced with a saner implementation.

## But...

The third vulnerability probably affects LibreSSL as well. You'll have to have access to the machine itself before you can exploit it, software that exposes an SSL endpoint are unlikely to be affected.

_Happy patching next week!_