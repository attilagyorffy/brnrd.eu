Title: LibreBSD 10.3-RC2 adds libtls and netcat
Tags: SSL, LibreSSL, OpenSSL, FreeBSD
Created: 2016-03-11
Author: Bernard Spil
Image: /img/netcat-libtls.png
Summary: Today's update to LibreBSD is an update tested on FreeBSD 10.3-RC2 and adds libtls and the TLS capable netcat implementation from the LibreSSL distribution. 

The FreeBSD source tree was tagged 10.3-RC2 with only minor [changes for zfs send](https://svnweb.freebsd.org/base?view=revision&revision=296631).

I had intended to add libtls and the TLS (no SSL in LibreSSL remember!) enabled netcat to 10.3 as well. This update marks the first version that includes these tools. Mainly this is a backport of the version found in HardenedBSD which I hope to work on again this weekend.

There's still some snags to this version which I have yet to iron out. The latest version can be found in the [LibreBSD](https://github.com/Sp1l/LibreBSD/tree/FreeBSD-10.3) github repo `FreeBSD-10.3` branch.

## Co-existence of netcat

FreeBSD is already shipped with `netcat` from OpenBSD, but the version from OpenBSD 5.8 which doesn't contain the TLS capability yet. The version in FreeBSD is not exactly the same as the one in OpenBSD, it adds [IPSec](https://en.wikipedia.org/wiki/IPsec) capability to netcat.

To work around this, I've renamed the TLS-enabled netcat binary to netcat. This 'release' has both versions in parallel. in the mean time I'm working on merging the FreeBSD changes into the OpenBSD version.

## Updates to GitHub

Every repo on GitHub should have a proper `README.md` which is displayed as the landing page of the repository.

Luckily, I use [Pelican](https://getpelican.com) as my static blog generator which I feed with MarkDown files, which -not so coincidentally- is also used for the README.md, so I copied my earlier blogpost in. Voilá, it now has a proper README.md!

## Proper netcat merging

The proper way to do this is detect `MK_LIBRESSL` and build the TLS-enabled version in stead of the regular version.

To add the IPSec capability, FreeBSD added two options to netcat 

	-E Shortcut for "-e 'in ipsec esp/transport//require' -e 'out ipsec
	   esp/transport//require'", which enables IPsec ESP transport mode
	   in both directions.
	
	-e If IPsec support is available, then one can specify the IPsec
	   policies to be used using the syntax described in
	   ipsec_set_policy(3). This flag can be specified up to two times,
	   as typically one policy for each direction is needed.

and what do you know, the `-e` flag is now also used in OpenBSD's netcat

	-e name
	   Specify the name that must be present in the peer certificate when
	   using TLS. Illegal if not using TLS.

To merge these, upstream has precedence and FreeBSD's addition must be renamed. I decided to use a long option `--ipsec-policy` to replace `-e`. This warrants an UPDATING entry if it is ever added to FreeBSD.

All in all this was more work then I had time for today, so expect updates later!
