Title: Replace OpenSSL with LibreSSL in FreeBSD 10.3 (guide)
Tags: SSL, LibreSSL, OpenSSL, FreeBSD
Created: 2016-03-08
Modified: 2016-03-10 21:55:00
Author: Bernard Spil
Image: /img/LibreBSD.png
Summary: (How-to Guide) How to replace OpenSSL with LibreSSL in FreeBSD 10.3. Since replacing OpenSSL in HardenedBSD (FreeBSD 11 based) wasn't all too difficult I decided to see if I could port that back to FreeBSD 10.3-RC1. Lo, and behold! the result in this blog post. Don't worry, 'LibreBSD' is only a quip.

**Before you ask:** This will not be a fork! I intend to maintain this as a patch-set for the most recent release of [FreeBSD](https://freebsd.org) and will maintain it for [HardenedBSD](https://hardenedbsd.org) as well.

Over the past weekend I managed to get LibreSSL to build, and all binaries to link to it on HardenedBSD. The patches were created on a derivative of the -to be released later this year- FreeBSD 11. See my earlier blog-posts for more details ([Part I](/libressl/2016-03-05/libressl-in-hardenedbsd-base-part-i.html) and [Part II](/libressl/2016-03-06/libressl-in-hardenedbsd-base-part-ii.html)).

I had tried to replace OpenSSL in FreeBSD 10 when I was at OpenBSD's LibreSSL hackathon in Varaždin (Croatia) last year but hadn't managed to complete the project. The release of LibreSSL 2.3 also removed SSLv3 so my attention was on fixing fallout from that removal. 'Evidence' of that work and the patches can be found in [the No-SSLv3](https://wiki.freebsd.org/OpenSSL/No-SSLv3) wiki article. As it turned out this time, it wasn't extremely difficult to do so I thought it wouldn't take too much time to do this for FreeBSD 10 as well. FreeBSD 10.3 is nearing its completion, so where better to start than with the current first Release Candidate!

**Feedback appreciated:** I haven't replayed all the steps here, do let me know where I've hidden my typos and mistakes! (email, Twitter, GitHub, Facebook, avionary)

# The 'recipe'

1. Download the [LibreSSL 2.3 tarball](http://ftp.openbsd.org/pub/OpenBSD/LibreSSL/libressl-2.3.2.tar.gz)
  * Extract this tarball into /usr/src/crypto and rename the directory from `libressl-2.3.2` to `libressl`
2. Apply the patch-set from [my GitHub repo](https://github.com/Sp1l/LibreBSD/tree/FreeBSD-10.3/patchset)
3. Add WITH_LIBRESSL=yes to /etc/src.conf
4. Rebuild and install your kernel and world (see the [FreeBSD handbook chapter](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/makeworld.html) for detail)
5. Reboot
6. Rebuild and reinstall all ports that require ssl libraries

My home system has already been completely converted to LibreBSD and so far worked without a hitch!

## Commands

As commands (assuming you already have checked out FreeBSD 10.3 into /usr/src)

	#!sh
	cd ~
	mkdir download && cd download
	fetch http://ftp.openbsd.org/pub/OpenBSD/LibreSSL/libressl-2.3.2.tar.gz
	fetch https://github.com/Sp1l/LibreBSD/raw/FreeBSD-10.3/patchset/patchset
	cd /usr/src/crypto
	tar xf ~/download/libressl-2.3.2.tar.gz
	mv libressl-2.3.2 libressl
	cd /usr/src
	patch < ~/download/patchset
	echo 'WITH_LIBRESSL=yes' >> /etc/src.conf
	make buildworld && make buildkernel && make installkernel && make installworld
	reboot

Line 3: You should verify the tarball using `signify` or `gpg`.	
Line 11: This should take quite a lot of time (probably hours) and is NOT the canonical way to do this. See the handbook [chapter on rebuilding your system](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/makeworld.html) for a complete description!	

Now that was easy wasn't it?

## Update your ports

After upgrading the kernel and world you'll need to rebuild all ports. If before you had defined

	:::make
	WITH_OPENSSL_PORT= yes
	OPENSSL_PORT=	security/libressl-devel

you can now remove these bits or at least the `WITH_OPENSSL_PORT` line. You should rebuild world and kernel after every update of LibreSSL. Unless the shared library version -and thus the ABI- stay the same. 

## Updating LibreSSL

LibreSSL frequently changes the shared library version -as proper software does-. Yet at times a new version is released that retains the same shared library version as the previous release.

**The files here will also be updated shortly after every LibreSSL release**

### Shared library versions unchanged

If LibreSSL receives an update that has the same shared library version, you can use my guidance from [the FreeBSD wiki](https://wiki.freebsd.org/BernardSpil/PartialWorldBuilds) after downloading/extracting the latest LibreSSL tarball as discussed in the previous paragraph.

	#!sh
	cd /usr/src/secure/lib/libcrypto
	make obj && make depend && make includes && make
	make install
	cd /usr/src/secure/lib/libssl
	make clean && make depend && make includes && make
	make install
	cd /usr/src/secure/usr.bin/openssl
	make clean && make
	make install

### Shared library version changed

The process is largely the same as the complete process, apart from applying the complete patches. The library version needs to be updated in the Makefile corresponding to the library. The files that you need are in files named `VERSION` in the corresponding directory in the LibreSSL sources. Copy that version to the Makefile for the library

	SHLIB_MAJOR=    37

Additionally you should update the following info in `secure/lib/libcrypto/Makefile.inc.libressl`

	OPENSSL_VER=    2.3.2
	OPENSSL_DATE=   2016-01-28

# The detail

**Note:** This doesn't include Kerberos yet.

Next to the patchset, I've also added all the files that were changed to my GitHub repo. The files are in their original location so you can use these as an overlay for your `/usr/src`.

## LibreSSL patches

FreeBSD 11 changed quite a lot in the build framework, so I had to adapt the patches for libcrypto, libssl and openssl accordingly. This made the build for the `openssl` binary fail, so I had to change

	:::make
	LIBADD+= crypto ssl

into

	:::make
	DPADD=  ${LIBSSL} ${LIBCRYPTO}
	LDADD=  -lssl -lcrypto

The bulk of the patches I created for HardenedBSD just worked just fine on 10.3 

## base software patches

Most of the patches that I created for HardenedBSD applied cleanly.

1. The patches for `libtelnet` and `ppp` worked fine.
2. The `wpa` patches are not required, in 10.3 there's a much older version that doesn't have all the OpenSSL version checks.
3. The `heimdal` patches I've not yet tested but these patches.