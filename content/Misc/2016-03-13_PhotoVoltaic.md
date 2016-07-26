Title: Goodwe logging to PVoutput
Date: 2016-03-13
Tags: Weekend, Solar, PV, IoT
Image: /img/PVOutput-Goodwe.png
Summary: Wasted a whole weekend creating an additional script to download data from Goodwe's portal and uploading it to PVOutput. This I think is the only IoT device I currently own, a solar power inverter. I already had a "Live" script and this adds a "Historic" script.

# The Internet-of-Things I don't really like

The Goodwe solar power inverter converts the 500V AC that comes from the solar (photo voltaic) panels on the roof of our house to 220V DC that I can use to power devices in my house. Luckily I still have a Ferraris type electricity metering device that nicely rotates backward when I produce more than I consume.

The nasty part of this device is that it is produced in China, and I have no real control over what it does. So it sits in its own network segment and can't see or reach anything. All it needs to be able to is to connect to the Goodwe portal to send data. From what I've seen, it sends data every 8 minutes.

I've looked at the inverter, it has a USB port. A service engineer seemed to use it as a Serial port, perhaps I can as well and log via different means.

# The Goodwe portal

I don't really like the Goodwe portal much, and I have no guarantees that it will remain in service forever. This is why I initially created a -plain POSIX- shell script to scrape the Goodwe portal and log it to a local csv file. 

# The "Realtime" script

The original "Realtime" script grabs the data from the ["Realtime"](http://www.goodwe-power.com/PowerStationPlatform/PowerStationReport/InventerDetail?ID=079dcd36-b4a5-4815-9bce-2aa8c3c2fbbe) tab of the Goodwe portal to extract the data. It logs every change of the values to a csv file and has additional features to only fetch/store between sunrise and sunset.

This script only works when it runs continuously...

# The "History" script

I forgot to add a `@reboot` entry to my crontab so it starts when the system reboots. This, no surprise there, I forgot so I was missing data since the last reboot.

Someone that found my script on the PVOutput help pages ["Contributed Software"](http://pvoutput.org/help.html#integration-contributed-software) section sent me an initial implementation. That prompted me to start building a new script that I can use to add the missing days.

When creating the new script, I decided to remove the settings that you can/should modify to `config.sh`, making it easier for me to post the scripts to GitHub and both scripts can share the configuration.

You can call the script in two ways, for a date, or for a range of dates.

	Usage: goodwe2PVoutput-hist.sh <start-date>
	       goodwe2PVoutput-hist.sh <start-date> <end-date>
	Date format: YYYY-MM-DD

## Scraping Goodwe-portal.com

The Goodwe portal has a [History](http://www.goodwe-power.com/PowerStationPlatform/PowerStationReport/InventerHistory?ID=079dcd36-b4a5-4815-9bce-2aa8c3c2fbbe) page that I had looked at before but didn't make sense as it showed a flat line. The trick was to click on the `PGrid(W)` timeseries label so you can change it to a different timeseries.

The page downloads all timeseries as a json for the inverter so that's a nice starting point. As input it needs the `Station ID` and the `Inverter S/N` which can be found in the URL and on the page visited. Chrome's "Developer View" or Firefox' "Inspector". Unlike PVOutput, Goodwe provides no API documentation.

	queryDate (YYYY-MM-DD): e.g. 2016-03-13
	stationID: e.g. 079dcd36-b4a5-4815-9bce-2aa8c3c2fbbe
	inverterSN: e.g. 35048ESU15800022
	URL: http://www.goodwe-power.com/PowerStationPlatform/PowerStationReport/QueryTypeChanged
	POST body: "InventerSN=${inverterSN}&QueryType=0&DateFrom=${queryDate}&PowerStationID=${stationId}"

The response is not easily processed in shell script but some `sed` helps. Additionally we add a '|' so we can replace it with a new-line using `tr`.

	sed '
	s/quot;//g;
	s/{"YAxis":"{name://;
	s/{name:/|/g;
	s/}[,]*//g;
	s/","XAxis":".*//
	'

This results in a set of timeseries, one per line. We can extract the timeseries that we can upload to PVoutput now using simple `sed` and use it to strip out anything apart from the numbers.

These timeseries we then use to generate the API calls to PVoutput.

## Posting to PVOutput.org

Lukcily there's [API documentation](http://pvoutput.org/help.html#api-addbatchstatus) so that makes our life slightly easier.

There are some snags to the PVoutput API like rate-limiting, but that also has proper documentation. If you've donated to PVoutput.org, the limits are extended (from 60 to 300 calls/hour and from 30 to 100 entries per post).

# Final words & TODO

All in all this wasn't overly complex to create, but figuring out how to grab the data from Goodwe was time consuming. Working with the rate-limits complicates things as well.

	




