Title: Moving to Uses/mysql.mk in the Ports Framework
Date: 2016-02-28
Tags: Ports, MariaDB, MySQL
Author: Bernard Spil
Status: Draft
Image: /img/MariaDB-10.0.24.png
Summary: A while ago I refactored the MySQL bits in `Mk/bsd.databases.mk` to `Mk/Uses/mysql.mk`. Time to pick up where I left off! Splitting off the MySQL bits from `bsd.databases.mk` was the easy part. The challenging part is fixing all the ports that currently use USE_MYSQL to register the MySQL dependency.

Back in November 2015 I was challenged to split off the MySQL part in `Mk/bsd.databases.mk` and use the new [USES](https://www.freebsd.org/doc/en/books/porters-handbook/uses.html) way of registering dependencies. I created a new `Mk\Uses\mysql.mk` file based on the PostgreSQL example.

# The USES Macros

The basics (from the [Porter's handbook](https://www.freebsd.org/doc/en/books/porters-handbook/uses.html))

> USES macros make it easy to declare requirements and settings for a
> port. They can add dependencies, change building behavior, add metadata
> to packages, and so on, all by selecting simple, preset values..

Before, you would use    
`USE_MYSQL= yes` or    
`USE_MYSQL= client`   
to register that your port depends on MySQL. With the USES Macro that would be transformed in
`USES=      mysql` or    
`USES=      mysql:client`    

There are some complications however. There's also the construct
`<OPT>_USE= mysql=yes` or    
`<OPT>_USE= mysql=client`    

# Finding all ports that register a dependency on MySQL

	:::sh
	for file in `ag --ignore 'pkg-*' --ignore 'distinfo' --ignore 'patch-*' -l mysql` ; do
	   perl -pe 's/\\\n/ /' $file \
	   | grep -iE '(USE_MYSQL|_USE.*mysql)' \
	   | sed -ne "/mysql/Is|^|${file}:|p"
	done

 1. Use "The Silver Searcher" to find all files that contain the string 'mysql' (case insensitive)
 2. Collapse continued lines (ending in '\')
 3. Only use lines containing either 'USE_MYSQL' or '<OPT>_USE= mysql'
 4. Prefix the output with the filename the result came from

This results in a list of all files that we probably have to work on. Circa 400 ports are found that depend on MySQL.

## False positives

There are some ports that have their own USES Macros or bsd.<lang>.mk file that mentions mysql e.g.    
`MYSQL_USE= PHP=pdo_mysql`
These will be captured as well and should be filtered out, I decided to do that manually.


