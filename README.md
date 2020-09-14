# Georgia Tech Library retroTECH Twitter Bot
The [Georgia Tech Library's retroTECH lab](http://library.gatech.edu/retrotech) specializes in collecting vintage technologies. One collecting area has been vintage video game consoles. This Twitter bot tweets weekly an image of a game from this collection with a link to a playable emulated version from the Internet Archive's [Console Living Room](https://archive.org/details/consolelivingroom%26tab=collection?tab=collection).

## Logic
The bot composes its tweets using the data provided by `data.json`:
1. The bot requests the image provided by `data.tweets[0].smartechUrl` and downloads the image locally in `./images/image.png`.
2. It then compiles a tweet with all the info from `data.tweets[0]`.
3. After tweet is sent, `data.tweets[0]` is deleted. This moves `data.tweets[1]` up and removes the need from having to loop through the data. `dataMain.json` is left untouched so there is a record to use if the bot crashes.
4. `./images/image.png` is also deleted.
5. The bot then waits a specified amount of time before tweeting again using [node-cron](https://www.npmjs.com/package/node-cron).

## Deploy

### Install and Run
1. `git clone https://github.com/PoorBillyPilgrim/gtlibrary-retrotech-twitterbot.git`
2. Twitter's API requires API secrets and tokens created in a Twitter developer account. Store yours in an `.env` file in the project directory.
3. Install dependencies: `cd gtlibrary-retrotech-twitterbot` then run `npm install` or `yarn install`.
4. Start bot: `node index`

### Manage Process
Instead of simply running `node index`, you can use process managers to restart your bot on a server reboot. I have used [pm2](https://pm2.keymetrics.io/) and [`systemd`](https://www.freedesktop.org/wiki/Software/systemd/) service units. I self host two projects on Ubuntu servers and have had luck using Ubuntu's [service units](http://manpages.ubuntu.com/manpages/cosmic/man5/systemd.service.5.html). A very simple example:

1. Create service unit: `sudo nano /etc/systemd/system/twitterbot.service` 
```
[Unit]
Description=retroTECH Twitter bot

[Service]
WorkingDirectory=/home/gtlibrary-retrotech-twitterbot
# ExecStart starts project (it's relative to WorkingDirectory)
ExecStart=/usr/bin/node index.js
# if process crashes, it will always try to restart
Restart=always

[Install]
WantedBy=multi-user.target
```
2. Run service: 
- `sudo systemctl daemon-reload`
- `sudo systemctl enable twitterbot`
- `sudo systemctl start twitterbot`
3. Check that it is running:
- `sudo systemctl status twitterbot`

## Credits
[An excellent article](https://journal.code4lib.org/articles/15112#note11) found in [code4lib Issue 48](https://journal.code4lib.org/issues/issues/issue48) by Meredith Hale of the University of Tennessee spurred me to create a Twitter Bot.

[Scott Carlson](https://www.scottcarlson.info/you-should-make-a-twitter-bot/) at Arizona State University was an immense help and resource.

## License
MIT License © Tyler Jones