Title: LetsEncrypt
Date: 2016-06-18
Modified: 2016-02-16 08:26:16
Tags: LetsEncrypt, SSL, FreeBSD, SysAdmin
Status: Draft
Category: Security
Author: Bernard Spil
Image: /img/LETSkENCRYPT.png
Summary: This page describes a setup to renew LetsEncrypt certificates with the Lets<i>k</i>encrypt client which has LibreSSL/libtls as its only dependency, uses chroots and drops privileges.

My [first guide](https://wiki.freebsd.org/BernardSpil/LetsEncrypt.py) used the official LetsEncrypt python client. I found that to be way too fat and had too many dependencies to be allowed to run as root.
My [second guide](https://https://brnrd.eu/security/2016-01-23/letsencrypt.html) used Lukas Schauer's LetsEncrypt.sh client which only required `openssl` and either `bash` or `zsh`. This is still a good method as it has separated privileged and un-privileged actions.

This guide uses [Lets<i>k</i>encrypt](https://kristaps.bsd.lv/letskencrypt/) created by Kristaps Dzonsons. 

> LETS<i>k</i>ENCRYPT is a client for Let's Encrypt users, but one designed for security. No Python. No Ruby. No Bash. A straightforward, open source implementation in C that isolates each step of the sequence.

As a proponent of LibreSSL I can't let solutions that use libtls from LibreSSL pass by without trying to use them. I'm the creator and maintainer of the `[security/letskencrypt](http://www.freshports.org/security/letskencrypt/)` port in the FreeBSD ports tree.

## Notes

Some notes on the configuration of my setup

1. All services accessible from the internet run in jails (all jails reside in `/usr/jails` by default on FreeBSD)
2. I use [LibreSSL](https://www.LibreSSL.org) as the provider of libcrypto, libssl and libtls on my FreeBSD system. The `security/letskencrypt` port depends on LibreSSL.

The `letskencrypt` process will be started by root but drops privileges to `[nobody](https://en.wikipedia.org/wiki/Nobody_(username))` and [chroot](https://en.wikipedia.org/wiki/Chroot)'s any action that does not require root privileges.

# Install Letsencrypt.sh

The port is available in the ports tree. Install it using the official pkg repository using

	:::sh
	pkg install letskencrypt

or alternatively build your own using [Poudriere](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/ports-poudriere.html) or any of the other building-from-source options and install it. The port works with either `security/libressl` or `security/libressl-devel`. If you want to use the newer 2.4 branch of LibreSSL you should add to

`/etc/make.conf`

	:::
	DEFAULT_VERSIONS+= ssl:libressl-devel

Configuration will land in `/usr/local/etc/letsencrypt`. The keys, certificates and certificate-chains will be stored in `/usr/local/etc/ssl/letsencrypt` by default. You should want to check that the configuration directory is not world-writable.

# Prepare directories 

To make life easier all of the challenges (!LetsEncrypt as well as keybase etc) will be hosted in a shared dir `/usr/local/www/.well-known` on the jail running my Apache server. 

The !LetsEncrypt bits will land in `/usr/local/etc/letsencrypt` and the keys and certs in `/usr/local/etc/ssl/letsencrypt` on the host system. 

## Migration from LetsEncrypt.sh

To migrate from the `LetsEncrypt.sh` method, copy/move your account key, the `domains.txt` file and all keys and certs to the new locations. Use the default filename, resolve symlinks to the actual timestamped file. Use the script as an example, yet it _should_ work for the default settings.

`migrate.sh`
	:::sh
	OLDDIR="/usr/local/etc/letsencrypt.sh"
	NEWDIR="/usr/local/etc/ssl"
	cp -p /usr/local/etc/letsencrypt{.sh,}/domains.txt}
	cp -p /usr/local/etc/letsencrypt{.sh/private_key.pem,/privkey.pem}
	mkdir -pm700 "${NEWDIR}/priv" 2>/dev/null
	cat "${OLDDIR}/domains.txt" | while read domain line ; do
	   mkdir -pm755 "${SSLDIR}/certs/${domain}"
	   cp -L "${OLDDIR}/certs/${domain}/privkey.pem" \
	         "${NEWDIR}/priv/${domain}.pem"
	   cp -L "${OLDDIR}/certs/${domain}/{cert,chain,fullchain}.pem" \
	         "${NEWDIR}/certs/${domain}/"
	done

# Modify Apache configuration 

The acme validation will `GET` a uniquely named file from `http://<example.org>/.well-known/acme-challenge/`

Access to the `.well-known` directory is granted in my main Apache config file `/usr/local/etc/apache24/httpd.conf`

`httpd.conf`
	:::apacheconf
	<Directory "/usr/local/www/.well-known/">
	   Options None
	   AllowOverride None
	   Require all granted
	   Header add Content-Type text/plain
	</Directory>

The Content-Type header was in my configs somewhere, shouldn't hurt.<<BR>>
If you want to only share the ACME challenges you can suffix `.well-known/` with `acme-challenge/`

Now every (non-ssl) Virtual Host that I have gets a on-line addition

`vhosts/domain.conf`
	:::apacheconf
	Alias /.well-known/ /usr/local/www/.well-known/

{{{#!wiki caution
You need to make sure that all (sub-)domains that you want to sign have access to this directory!<<BR>>
That includes rewrites etc.<<BR>>
The acme validation is done only using '''plain http''' and will not honour redirects etc.
}}}

# Letsencrypt configuration 

`Letskencrypt` works different from the other clients I've used as it does **not** use configuration files. Everything is handled passing parameters with values to the command. The intende use-case is a system that hosts a single domain.

I've tried to remain compatible with the `LetsEncrypt.sh` method using a file that lists domains and using the first (primary) hostname as prefix for the filenames. This filename-prefix handling is likely to be added in a future version. This could equally well be done with an inline HERE-document

## Wrapper script

This has immense opportunity for foot-shooting (does no input-validation). Make sure your script and `domains.txt` file are OK can only be modified by root!

`letskencrypt.sh`
	:::sh
	#!/bin/sh
	set -e
	BASEDIR="/usr/local/etc/letsencrypt"
	SSLDIR="/usr/local/etc/ssl"
	DOMAINSFILE="${BASEDIR}/domains.txt"
	CHALLENGEDIR="/usr/jails/http/usr/local/www/.well-known/acme-challenge"
	[ ! -d "${SSLDIR}/priv" ] && mkdir -pm700 "${SSLDIR}/priv"
	cat "${DOMAINSFILE}" | while read domain line ; do
	   CERTSDIR="${SSLDIR}/certs/${domain}"
	   [ ! -d "${CERTSDIR}" ] && mkdir -pm755 "${CERTSDIR}"
	   letskencrypt -C "${CHALLENGEDIR}" \
	                -k "${SSLDIR}/priv/${domain}.pem" \
	                -c "${CERTSDIR}" \
	                ${domain} ${line}
	done

### Domains to sign 

The script requires a list of domain names you want to have a SAN cert for in the following format:

	example.com www.example.com
	example.net www.example.net wiki.example.net

Domains and sub-domains that are listed on the ''same line'' will result in SAN-certificates ([Subject-Alternative-Name](https://en.wikipedia.org/wiki/SubjectAltName)).<<BR>>
Store this as `/usr/local/etc/letsencrypt/domains.txt`

### In-line configuration

If you don't want to use a `domains.txt` configuration file you can use a different construct to include the list in your script (changed lines only).

	:::sh
	...
	while read domain line ; do
	...
	done <<ENDOFLIST
	example.com www.example.com
	example.net www.example.net wiki.example.net	
	ENDOFLIST

## Configure periodic job 

The `security/letsencrypt.sh` port includes a periodic job that makes automation very simple. To automatically renew certificates, add the following to your `/etc/periodic.conf`

	:::sh
	weekly_letsencrypt_enable="YES"
	weekly_letsencrypt_user="_letsencrypt"
	weekly_letsencrypt_deployscript="/usr/local/etc/letsencrypt.sh/deploy.sh"

# First run 

You will probably want to run your !LetsEncrypt manually the first time

	:::sh
	cd /usr/local/etc/ssl
	../letsencrypt/letskencrypt.sh

You will end up with a sub-directory `certs` that contains your domains as directories with the Subject-Alternative-Names certs and the corresponding private keys in the `priv` sub-directory.

	certs/example.com/
	   cert.pem
	   chain.pem
	   fullchain.pem
	priv/example.com.pem
	certs/example.net/
	   cert.pem
	   chain.pem
	   fullchain.pem
	priv/example.net.pem

# Deploy new certs 

We've run the certificate request process as a restricted user but you'll need to run the deploy script as `root`.

Here you'll probably need to get creative with scripting. In the host environment, your now have

	/usr/local/etc/ssl/priv/example.net.pem
	/usr/local/etc/ssl/certs/example.net/fullchain.pem

## Example (jailed) applications 

Your Apache server may (should?) run in the `http` jail and you've setup an Apache Virtual Host with

	:::apacheconf
	SSLCertificateFile /etc/ssl/certs/example.net.pem
	SSLCertificateKeyFile /etc/ssl/priv/example.net.pem

and your OpenSMTPd mailserver for example.net in the `mail` jail

	pki example.net certificate "/etc/ssl/certs/example.net.pem"
	pki example.net key         "/etc/ssl/priv/example.net.pem"
	listen on $lan_addr port 587 tls-require \
	       pki example.net hostname example.net auth

Seen from the host environment your certificates actually need to end up in 

	/usr/jails/```http```/etc/ssl
	/usr/jails/```mail```/etc/ssl

## Example deployment script 

You could use the following script to deploy new certs

`/usr/local/etc/letsencrypt/deploy.sh`
	:::sh
	#!/bin/sh
	domain="example.net"
	letsencryptdir="/usr/local/etc/ssl"
	targets="mail http"
	for jail in ${targets}; do
	  targetdir="/usr/jails/${jail}/etc/ssl"
	  # Check if the certificate has changed
	  [[ -z "`diff -rq ${letsencryptdir}/certs/${domain}/fullchain.pem ${targetdir}/certs/${domain}.pem`" ]] && continue
	  cp -L "${letsencryptdir}/priv/${domain}.pem"   "${targetdir}/priv/${domain}.pem"
	  cp -L "${letsencryptdir}/certs/${domain}/fullchain.pem" "${targetdir}/certs/${domain}.pem"
	  chmod 400 "${targetdir}/priv/${domain}.pem"
	  chmod 644 "${targetdir}/certs/${domain}.pem"
	  # Restart/-load relevant services
	  [[ "${jail}" = "http" ]] && jexec ${jail} service apache24 restart
	  [[ "${jail}" = "mail" ]] && jexec ${jail} service smtpd    restart
	done

Store this as `/usr/local/etc/letsencrypt.sh/deploy.sh` and make sure the execute bit is set.<<BR>>
'''NB:''' Some applications want a private key, certificate and separate chain instead. If this is the case you'll need to copy `cert.pem` and `chain.pem` to the appropriate location in stead.

