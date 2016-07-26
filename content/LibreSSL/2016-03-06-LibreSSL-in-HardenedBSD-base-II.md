Title: LibreSSL in HardenedBSD base Part II
Tags: SSL, LibreSSL, OpenSSL, HardenedBSD
Created: 2016-03-06
Modified: 2016-03-06
Author: Bernard Spil
Image: /img/TelnetWPAHeimdal.png
Summary: Part 2 of a multi/many part series on building FreeBSD base with LibreSSL as libcrypto/libssl provider, buildworld phase.

Yesterday I managed to get LibreSSL to build `libcrypto`, `libssl` and `openssl` in base but that is just the beginning. The ultimate target is to build the whole system with LibreSSL as a replacement of OpenSSL. (note the difference between `openssl`, the binary, and [OpenSSL](http://openssl.org), the project).

# Leftovers after integrating in base

As I hacked LibreSSL into base it was to be expected that there were some rough parts still. E.g. `make buildworld` would fail. The FreeBSD build system consists of many stages causing `make buildworld` to behave quite different from running `make` in e.g. `secure/lib/libcrypto`.

* `cd /usr/src ; make buildworld` : Generates and uses only resources in /usr/obj
* `cd /usr/src/secure/lib/libcrypto ; make` : Uses resources from the running system

The only way I've found to properly test this is to actually do the buildworld. As a full builworld takes about 2 hours, you should use `-DNO_CLEAN` otherwise it first deletes all already built resources.

## Headers

In one of the stages, it will generate include headers that will be used throughout the build. These were missing from my `Makefile`. Let me try and explain that using snippets from the OpenBSD and FreeBSD `Makefile`s

	:::make
	# At the top of the Makefile:
	# asn1/
	SRCS+= a_object.c a_bitstr.c a_time.c a_int.c a_octet.c
	SRCS+= a_print.c a_type.c a_dup.c a_d2i_fp.c a_i2d_fp.c
	# Towards the bottom of the Makefile:
	HDRS=\
		crypto/aes/aes.h \
		crypto/asn1/asn1.h \

Compared with FreeBSD's

	:::make
	# At the top of the Makefile:
	# asn1
	SRCS+=	a_bitstr.c a_bool.c a_bytes.c a_d2i_fp.c a_digest.c a_dup.c a_enum.c \
		a_gentm.c a_i2d_fp.c a_int.c a_mbstr.c a_object.c a_octet.c a_print.c \
	INCS+=	asn1.h asn1_mac.h asn1t.h

Obviously OpenBSD uses a different way to generate/install the headers. This was fixed by extracting the HDRS from the OpenBSD Makefile and adding a block of `INCS+=` towards the top of the FreeBSD Makefile.

	:::make
	INCS+=  crypto.h opensslv.h ossl_typ.h
	INCS+=  aes.h asn1.h asn1_mac.h asn1t.h
	INCS+=  blowfish.h bio.h bn.h buffer.h

With this change, the headers are properly generated and can be found in `/usr/obj/usr/src/tmp/usr/include` which is  used as include path for buildworld.

## Stupidity

The dangers of copying/pasting... Build was failing with references to files in crypto/openssl/engine. The culprit was a line I had not removed from the LibreSSL Makefile.

	:::make
	DIRS+= engines

This would add the OpenSSL engines directory to the code to compile which is bound to fail. LibreSSL has way fewer engines and these are included in the regular Makefile, no need for a sub-directory.

	:::make
	# engine/
	SRCS+= eng_err.c eng_lib.c eng_list.c eng_init.c eng_ctrl.c
	SRCS+= eng_table.c eng_pkey.c eng_fat.c eng_all.c

## N00bness

I added the `include/compat` directory to the `Makefile`'s `.PATH` target. There's some overlap in the header files there, so I got issues with `err.h` which existed in both `include/compat` and `include/openssl`. Had I properly checked the original `Makefile` I would have noticed that compat was not in `.PATH` but the source files were prefixed with `compat/`. Compare

	:::make
	# compat/
	SRCS+=  explicit_bzero.c getentropy_freebsd.c reallocarray.c
	SRCS+=  timingsafe_bcmp.c timingsafe_memcmp.c
	# 
	.PATH ${LCRYPTO_SRC} \
		${LCRYPTO_SRC}/compat \		
		${LIBRESSL_SRC}/include/compat \		
		${LIBRESSL_SRC}/include/openssl \		

	:::make
	# compat/
	SRCS+=  compat/explicit_bzero.c compat/getentropy_freebsd.c compat/reallocarray.c
	SRCS+=  compat/timingsafe_bcmp.c compat/timingsafe_memcmp.c
	.PATH ${LCRYPTO_SRC} \
		${LIBRESSL_SRC}/include/openssl \		

# Problems with code in base

As was to be expected, building world would lead to a number of issues with the code, not unlike the issues [found in ports](https://wiki.freebsd.org/LibreSSL/PatchingPorts). I quickly ran in to problems with EGD (the Perl Entropy Gathering Daemon) and deprecated `DES` methods.

## EGD

FreeBSD has not needed the Perl [Entropy Gathering Daemon](https://en.wikipedia.org/wiki//dev/random#EGD_as_an_alternative) (EGD) since FreeBSD 4.2 and no Operating System that is supported by a vendor needs it any longer. EGD was only necessary for some commercial UNIX systems, versions that needed it all reached end of life.

OpenSSL 1.1 also [removes RAND_egd](https://github.com/openssl/openssl/commit/0423f812dc61f70c6ae6643191259ca9e5692c7f) by default.

[Bug 207742 - crypto/heimdal requires RAND_egd capable libcrypto](https://bugs.freebsd.org/207742)

## des_

OpenSSL has deprecated a large number of des_ methods and types on [24 October 2001](https://github.com/openssl/openssl/commit/c2e4f17c1a0d4d5115c6ede9492de1615fe392ac) and released this 30 December 2002 with OpenSSL 0.9.7. The promise "The compatibility functions will be removed in some future release, at the latest in version 1.0." was obviously not kept.

LibreSSL removed `des_old.h`, and so has the [next release](https://github.com/openssl/openssl/commit/24956ca00f014a917fb181a8abc39b349f3f316f) of OpenSSL (1.1) 

[Bug 207743 - contrib/telnet uses deprecated des_* methods](https://bugs.freebsd.org/207743)	
[Bug 207744 - usr.sbin/ppp uses deprecated des_* methods](https://bugs.freebsd.org/207744)

## OpenSSL version checks

LibreSSL defines the OpenSSL version (`OPENSSL_VERSION_NUMBER`) as `0x2000000L` but was forked from OpenSSL 1.0.1g with version `0x1000107fL`. This causes many comparisons to result in problems if it tests for 1.0.2 (`0x10002000L`) or 1.1.0 (`0x10010000L`). In 2.3 LibreSSL added a `LIBRESSL_VERSION_NUMBER` to `opensslv.h` which can be used to detect that LibreSSL is used. The wpa_supplicant code already uses `BORINGSSL_VERSION_NUMBER` checks, adding the LibreSSL version checks should be OK.

The wpa_supplicant code is littered with `OPENSSL_VERSION_NUMBER` checks, e.g.

	:::c
	#if OPENSSL_VERSION_NUMBER >= 0x10002000L
	
	#if OPENSSL_VERSION_NUMBER < 0x10010000L

If we simply change this to 

	:::c
	#if OPENSSL_VERSION_NUMBER >= 0x10002000L && !defined(LIBRESSL_VERSION_NUMBER)

	#if OPENSSL_VERSION_NUMBER < 0x10010000L || defined(LIBRESSL_VERSION_NUMBER)

We're OK.

[Bug 207745 - contrib/wpa Version checks failing with LibreSSL](https://bugs.freebsd.org/207744)

# World build completed

This is what it is all about

	--------------------------------------------------------------
	>>> World build completed on Sun Mar  6 14:21:07 CET 2016
	--------------------------------------------------------------

# Building the kernel

The HARDENEDBSD kernel built without a hitch!

# EUREKA!!!

After snapshotting zroot/ROOT/default, I proceeded to install the kernel and world and rebooted the (virtual) system.

All was functioning just fine!

	:::log
	Mar  6 15:26:14 hbsd kernel: [1] FreeBSD 11.0-CURRENT-HBSD #0 2aecd7d(hardened/current/libressl)-dirty: Sun Mar  6 14:44:08 CET 2016
	Mar  6 15:26:14 hbsd kernel: [1]     bernard@hbsd:/usr/obj/usr/src/sys/HARDENEDBSD amd64
	Mar  6 15:26:14 hbsd kernel: [1] FreeBSD clang version 3.7.1 (tags/RELEASE_371/final 255217) 20151225
	Mar  6 15:26:14 hbsd kernel: [1] CPU: Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz (3901.00-MHz K8-class CPU)
M

	:::sh
	$ openssl version
	LibreSSL 2.3.2

	$ openssl s_client -connect google.com:443
	CONNECTED(00000003)
	depth=2 C = US, O = GeoTrust Inc., CN = GeoTrust Global CA
	verify error:num=20:unable to get local issuer certificate
	verify return:0
	---
	Certificate chain
	 0 s:/C=US/ST=California/L=Mountain View/O=Google Inc/CN=google.com
	   i:/C=US/O=Google Inc/CN=Google Internet Authority G2
	 1 s:/C=US/O=Google Inc/CN=Google Internet Authority G2
	   i:/C=US/O=GeoTrust Inc./CN=GeoTrust Global CA
	 2 s:/C=US/O=GeoTrust Inc./CN=GeoTrust Global CA
	   i:/C=US/O=Equifax/OU=Equifax Secure Certificate Authority
	---
	Server certificate
	-----BEGIN CERTIFICATE-----
	-----END CERTIFICATE-----
	subject=/C=US/ST=California/L=Mountain View/O=Google Inc/CN=google.com
	issuer=/C=US/O=Google Inc/CN=Google Internet Authority G2
	---
	No client certificate CA names sent
	---
	SSL handshake has read 10775 bytes and written 438 bytes
	---
	New, TLSv1/SSLv3, Cipher is ECDHE-RSA-CHACHA20-POLY1305
	Server public key is 2048 bit
	Secure Renegotiation IS supported
	Compression: NONE
	Expansion: NONE
	No ALPN negotiated
	SSL-Session:
	    Protocol  : TLSv1.2
	    Cipher    : ECDHE-RSA-CHACHA20-POLY1305

	$ ls -l /usr/lib/lib{crypto,ssl}*
	-r--r--r--  1 root     wheel  3564788 Mar  6 15:12 /usr/lib/libcrypto.a
	lrwxr-xr-x  1 root     wheel       25 Mar  6 15:12 /usr/lib/libcrypto.so -> ../../lib/libcrypto.so.38
	-r--r--r--  1 root     wheel  3830328 Mar  6 15:12 /usr/lib/libcrypto_p.a
	-r--r--r--  1 root     wheel   569182 Mar  5 17:57 /usr/lib/libssl.a
	lrwxr-xr-x  1 root     wheel       12 Mar  6 15:12 /usr/lib/libssl.so -> libssl.so.38
	-r--r--r--  1 root     wheel   370120 Mar  6 15:12 /usr/lib/libssl.so.38
	-r--r--r--  1 root     wheel   597126 Mar  5 17:57 /usr/lib/libssl_p.a
		
# What's next

It isn't done just yet! Several things require more work:

1. Adding assembly code
2. Add manual pages
3. Polish the changes
4. More testing