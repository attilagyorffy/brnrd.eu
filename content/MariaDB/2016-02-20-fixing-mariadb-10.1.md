Title: Fixing the MariaDB 10.1 port
Date: 2016-02-20
Tags: FreeBSD, Ports
Author: Bernard Spil
Image: /img/MariaDB10.1.png
Summary: Last week I committed MariaDB 10.1 to ports, but it was obviously not tested well enough. Issues were detected when building on i386 and 9.3 and the OQGraph storage engine doesn't build. Time to fix all the errors! 

Always a pesky thing when MariaDB fails building, on my rig it takes about 15 minutes to compile the -server port. For good measure I'll test the non-default storage engines as well.

It did still work correctly but enabling/disabling plugins was changed between 10.0 and 10.1

10.0	`cmake -DWITHOUT_OQGRAPH=1`    
10.1	`cmake -DPLUGIN_OQGRAPH=NO`

Luckily the 'old' way still worked as well.

## Building on i386

Compilation fails when building on 10.2 i386. The fix for this is to build with GCC in stead of with the default clang.

	:::make
	.if ${OPSYS} == FreeBSD && ${OSVERSION} >= 1000024 && ${ARCH} == i386
	USE_GCC=	yes
	.endif

## Building on 9.3

Builds failed where the issues were suffering earlier when Kerberos configuration was not detected properly. Digging further I found that 9.3 has an old Heimdal in the base system (version 1.1) that does not contain the methods that MariaDB requires. This poses other issues with the regular way to use GSSAPI, the default it to use the Heimdal kerberos libraries from base. I haven't found a way to change to Heimdal from ports on 9.3.

	:::make
	.if ${OPSYS} == FreeBSD && ${OSVERSION} >= 1000012
	...
	.else
	.if ${PORT_OPTIONS:MGSSAPI_BASE}
	IGNORE= MariaDB requires a Kerberos implementation from ports. Select GSSAPI_HEIMDAL or GSSAPI_MIT option
	.endif
	.endif

This will cause the port to not build on the FreeBSD package builders at all.

## Engines

### TokuDB

Already builds with lang/gcc48 because of upstream support. Currently fails with

	/usr/ports/databases/mariadb101-server/work/mariadb-10.1.11/storage/tokudb/PerconaFT/ft/ft-ops.cc:2827:5: error: 'was_already_open' may be used uninitialized in this function [-Werror=maybe-uninitialized]
	     if (!was_already_open) {
	     ^
	/usr/ports/databases/mariadb101-server/work/mariadb-10.1.11/storage/tokudb/PerconaFT/ft/ft-ops.cc:2767:10: note: 'was_already_open' was declared here
	     bool was_already_open;
	          ^
	lto1: all warnings being treated as errors

Traced this back to an issue with the flags passed to gcc. Added a patch for the cmake module that does the checks.

	std::string numWithCommas = to_string(value);
	std::string numWithCommas = std::to_string(value);



### OQGraph

There's still a number of issues open. Upstream builds the GSSAPI client auth plugin only with the server and not with the client.





