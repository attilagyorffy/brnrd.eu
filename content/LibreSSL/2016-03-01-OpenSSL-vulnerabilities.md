Title: Impact of new OpenSSL vulnerabilties on LibreSSL
Tags: SSL, LibreSSL, OpenSSL
Modified: 2016-03-01 16:17:00
Author: Bernard Spil
Image: /img/VulnerabilityAhead.png
Summary: As announdes about a week ago, today a new load of OpenSSL vulnerabilities is disclosed. Latest impact analysis: No need to scramble.

**Disclaimer:** I'm neither a C-programmer nor a cryptographer. This is my personal assessment of the issues and provides no guarantees and comes without any warranty.

16:27 CET: Added links	
16:28 CET: Added LibreSSL impact in table	
16:47 CET: Add confirmation from Bob Beck

| CVE reference | Severity | LibreSSL | Description |
|:---|:---|:---|:---|
| CVE-2016-0702 | Low | ??? | Side channel attack on modular exponentiation (CacheBleed) |
| CVE-2016-0703 | High | Not vulnerable | Divide-and-conquer session key recovery in SSLv2 |
| CVE-2016-0704 | Moderate | Not vulnerable | Bleichenbacher oracle in SSLv2 |
| CVE-2016-0705 | Low | Not vulnerable | Double-free in DSA code	|
| CVE-2016-0797 | Low | ??? | BN_hex2bn/BN_dec2bn NULL pointer deref/heap corruption |
| CVE-2016-0798 | Low | Memory leak in SRP database lookups |
| CVE-2016-0799 | Low | Not vulnerable | Fix memory issues in BIO_*printf functions |
| CVE-2016-0800 | High | Not vulnerable | Cross-protocol attack on TLS using SSLv2 (DROWN) |

Bob Beck [confirmed](https://twitter.com/bob_beck/status/704693297583788032) that there's no immediate need to patch LibreSSL

# CacheBleed (CVE-2016-0702)

LibreSSL: Assumed Vulnerable	
Severity: Low

Vulnerability can only be exploited by a user on the local system and requires running 2 HT threads on the same CPU core. Extremely complex to achieve and not exploitable remotely. No reason to worry unless you have untrusted users logging on to your sysem (ssh etc.)

OpenSSL source diffs
[1](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=d6482a82bc2228327aa4ba98aeeecd9979542a31)
[2](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=5ea08bd2fe6538cbccd89f07e6f1cdd5d3e75e3f)
[3](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=d6d422e1ec48fac1c6194ab672e320281a214a32)
[4](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=8fc8f486f7fa098c9fbb6a6ae399e3c6856e0d87)
[5](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=317be63875e59efa34be0075eaff3c033ef6969f)

# DROWN (CVE-2016-0800)

LibreSSL: Not Vulnerable	

SSLv2 was deleted from LibreSSL long ago, prior to the first release.

LibreSSL [diff](http://cvsweb.openbsd.org/cgi-bin/cvsweb/src/lib/libssl/src/ssl/ssl_txt.c.diff?r1=1.11&r2=1.12&f=h) (2014!)

# CVE-2016-0704

LibreSSL: Not Vulnerable
Severity: Moderate	

SSLv2 was deleted from LibreSSL long ago, prior to the first release.

LibreSSL [diff](http://cvsweb.openbsd.org/cgi-bin/cvsweb/src/lib/libssl/src/ssl/ssl_txt.c.diff?r1=1.11&r2=1.12&f=h) (2014!)

# CVE-2016-0705

LibreSSL: Probably Vulnerable	
Severity: Low

LibreSSL contains same code but other mitigations are in place [source](https://twitter.com/MiodVallat/status/704687807168684037)

Source [diff](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=ab4a81f69ec88d06c9d8de15326b9296d7f498ed)

# CVE-2016-0797

LibreSSL: Probably Vulnerable	
Severity: Low

LibreSSL contains same code

Source [diff](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=99ba9fd02fd481eb971023a3a0a251a37eb87e4c)

# CVE-2016-0798

LibreSSL: Not Vulnerable	
Severity: Low

SRP feature was removed long ago.

Source [diff](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=380f18ed5f140e0ae1b68f3ab8f4f7c395658d9e)

# CVE-2016-0799

LibreSSL: Not Vulnerable	

The complete code was replaced with far simpler code. Who needs to reimplement printf!

Source [diff](http://git.openssl.org/?p=openssl.git;a=commitdiff;h=9cb177301fdab492e4cfef376b28339afe3ef663)
	
_Happy patching _
