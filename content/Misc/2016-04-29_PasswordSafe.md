Title: PasswordSafe on FreeBSD
Date: 2016-04-29
Tags: FreeBSD, Security
Image: /img/PWSafe.png
Summary: I've used PasswordSafe for many, many years to keep my passwords safe and make it easy to use unique passwords whereever I can. Last year I adapted the Linux version (0.96) to run on FreeBSD. As I was reinstalling my laptop to run the experimental PC-BSD I thought it was about time I checked my earlier work.

Once you've stored all your passwords in a password vault or manager and you've switched to using random 12-character passwords wherever you can it becomes really painful to work without one. Passwords like 'v83VuH.+Hb$q' are very cumbersome to type without typos, I've found. So the only thing keeping me from using a FreeBSD desktop was the password manager...

This is mostly a promo... If you're not using a password manager yet, please use PasswordSafe, if you're using a different password manager, please consider switching to PasswordSafe. If you're an attacker, I deem it safe enough to store my vault on my private cloud!

# About PasswordSafe

[PasswordSafe](https://pwsafe.org) was originally created by renowned cryptographer [Bruce Schneier](https://schneier.com) but is now maintained by Rony Shapiro. According to academic research it has the [most secure storage format](http://www.cs.ox.ac.uk/files/6487/pwvault.pdf) of the available password managers and is a [solid](http://crypto.stanford.edu/~dabo/pubs/abstracts/pwdmgrBrowser.html) [tool](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/li_zhiwei) to keep your passwords safe. There are tools capable of reading the vault [for many platforms](http://www.pwsafe.org/relatedprojects.shtml) yet the official tool was not ported to FreeBSD.

# The FreeBSD port

Last year I was planning to go to EuroBSDcon and I thought that it wouldn't do to show up with a laptop running Windows (all my servers run FreeBSD though) so I had to try porting the Linux version of the client to FreeBSD. This was early days for me actively providing patches to  FreeBSD so I felt as a n00b but I tried nonetheless. Luckily the maintainer of the project was happy with adding another platform and [imported my changes](https://github.com/pwsafe/pwsafe/commit/c140da724ed3fc28a7b0cb23ba03ea734e8dfa9c) after sanitizing them.

After upgrading my system and simply going back to my backed up source tree and binaries for PasswordSafe I was surprised that it still ran!

# Upgrading to 0.98

Meanwhile, the project had moved on to release 0.98.1 BETA so an update was due...

For some reason some Linuxisms were added, please don't clobber my CC and CXX variables!

Security measures were added to prevent debugging and writing core files. FreeBSD does not have `pctl` so I had to revert to `procctl` and `rlimit`. This prevent attackers from attaching a debugger to the process to read plaintext passwords and prevents coredumps on the process. Thanks to Jilles helping me figure this out! This still doesn't protect you from root so beware! 

Obviously my patching and porting has improved, the [pull request](https://github.com/pwsafe/pwsafe/pull/97) was imprted without changes. Seems like itemizing changes in commits works! All of this without any proper knowlegde of GTK, wxWidgets or graphics in general, you can do this too!

So, now all go and use it!

# Todo

This is a work in progress and when starting the client it'll complain that the help feature isn't available so I have more porting/building to make this work.

Then There's the port that still needs to be created. security/pwsafe would be a very nice spot for this to land!


