require('dotenv').config();
const fs = require('fs');
const Twit = require('twit');
const request = require('request');
const data = require('./data.json');
const CronJob = require('cron').CronJob;
const express = require('express');

const app = express();
const port = process.env.PORT;

/** Intermediate certificates for smartech.library.gatech.edu
 *  were not bundled in the certificate chain,
 *  so I downloaded them and manually bundled them using the ssl-root-cas module
 *  Docs: https://www.npmjs.com/package/ssl-root-cas
 */
const rootCas = require('ssl-root-cas/latest').create();
rootCas
    .addFile(__dirname + '/ssl/intermediate-01.pem')
    .addFile(__dirname + '/ssl/intermediate-02.pem');
require('https').globalAgent.options.ca = rootCas;


// Twitter API credentials
const T = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const imgPath = './images/image.png'
const handleError = (err) => {
    if (err) {
        console.error(err);
    }
}

// Download image from url
const downloadImage = (url, path, callback) => {
    console.log('downloading image');
    request.head(url, () => {
        request(url)
            .on('error', (err) => console.error(err))
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    });
}

// Read ./images/image.png and upload to Twitter
const postTweet = (img, callback) => {
    fs.readFile(img, { encoding: 'base64' }, (err, b64content) => {
        handleError(err);
        console.log('uploading image to Twitter');
        T.post('media/upload', { media_data: b64content }, (err, img, response) => {
            handleError(err);
            if (!err) {
                fs.readFile('data.json', (err, data) => {
                    handleError(err);
                    let arr = JSON.parse(data),
                        gameTitle = JSON.stringify(arr.tweets[0].gameTitle),
                        releaseDate = JSON.stringify(arr.tweets[0].releaseDate),
                        gameSystem = JSON.stringify(arr.tweets[0].gameSystem),
                        internetArchiveUrl = JSON.stringify(arr.tweets[0].internetArchiveUrl);
                    // The second parameter is an object that identifies the values to be tweeted
                    // media_id == image
                    // status == text of status update
                    T.post('statuses/update', {
                        status: `${gameTitle.slice(1, -1)} was released in ${releaseDate.slice(1, -1)} for the ${gameSystem.slice(1, -1)} and can be found in the Georiga Tech Library's retroTECH collection. Play it online at the Internet Archive's Console Living Room: ${internetArchiveUrl.slice(1, -1)}.`,
                        media_ids: new Array(img.media_id_string),
                        alt_text: { text: `${gameTitle} for ${gameSystem}` }
                    }, (err, data, response) => {
                        handleError(err);
                        console.log(data);
                        if (callback) {
                            callback(err);
                        }
                    })
                })
            }
        })
    })
}

// Delete ./images/image after upload
const deleteImage = (img, text, callback) => {
    fs.unlink(img, (err) => {
        handleError(err);
        console.log(`image deleted`);
    });
}

// Read data.json file, deletes the first entry, and saves the new file
const editJsonFile = (fileName, callback) => {
    fs.readFile(fileName, 'utf-8', (err, data) => {
        handleError(err);
        const arr = JSON.parse(data);
        arr.tweets.shift();
        fs.writeFile(fileName, JSON.stringify(arr), (err) => {
            handleError(err);
            console.log('file saved')
        });
    });
}

app.listen(port, () => {

    // Scheduled to tweet every Wednesday at 9am ET
    const job = new CronJob('* 9 * * Wed', () => {
        fs.readFile('data.json', (err, data) => {
            handleError(err);
            let arr = JSON.parse(data),
                url = JSON.stringify(arr.tweets[0].smartechUrl);
            // JSON.stringify() wraps the already quoted string in more quotes
            // slice(1, -1) removes the extra quotes
            downloadImage(url.slice(1, -1), imgPath, () => {
                postTweet(imgPath, (err) => {
                    deleteImage(imgPath, arr.tweets[0].text);
                    editJsonFile('data.json');
                })
            })
        })
    })

    job.start();

})


