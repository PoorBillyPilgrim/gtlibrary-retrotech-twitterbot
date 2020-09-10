# Georgia Tech Library retroTECH Twitter Bot
The [Georgia Tech Library's retroTECH lab](http://library.gatech.edu/retrotech) specializes in collecting vintage technologies. One collecting area has been vintage video game consoles. This Twitter Bot tweets daily an image of an item from this collection with a link to a playable emulated version from the Internet Archive's [Console Living Room](https://archive.org/details/consolelivingroom%26tab=collection?tab=collection).

## Logic
The bot bases its tweets off the data provided by `data.json`:
1. The bot requests the image provided by `data.tweets[0].smartechUrl` and downloads the image locally in `./images/image.png`.
2. It then compiles a tweet with all the info from `data.tweets[0]`.
3. After tweet is sent, `data.tweets[0]` is deleted. This moves `data.tweets[1]` up and removes the need from having to loop through the data. `dataMain.json` is left untouched so there is a record to use if the bot crashes.
4. `./images/image.png` is also deleted.
5. The bot then waits a specified amount of time before tweeting again using [node-cron](https://www.npmjs.com/package/node-cron).

## Credits
[An excellent article](https://journal.code4lib.org/articles/15112#note11) found in [code4lib Issue 48](https://journal.code4lib.org/issues/issues/issue48) by Meredith Hale of the University of Tennessee spurred me to create a Twitter Bot.

Scott Carlson's [Python Twitter Bot](https://www.scottcarlson.info/you-should-make-a-twitter-bot/) was an immense help.

## License
MIT License © Tyler Jones