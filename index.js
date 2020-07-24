require('dotenv').config();
const fs = require('fs');
const Twit = require('twit');
const request = require('request');
const data = require('./data.json');
const CronJob = require('cron').CronJob;

/** Intermediate certificates for smartech.library.gatech.edu
 *  They were not bundled in the certificate chain,
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
        console.log('uploading image');
        T.post('media/upload', { media_data: b64content }, (err, img, response) => {
            handleError(err);
            if (!err) {
                fs.readFile('data.json', (err, data) => {
                    handleError(err);
                    let arr = JSON.parse(data),
                        text = JSON.stringify(arr.tweets[0].text),
                        url = JSON.stringify(arr.tweets[0].url);
                    // The second parameter is an object that identifies the values to be tweeted
                    // media_id == image
                    // status == text of status update
                    T.post('statuses/update', { status: `Check out ${text.slice(1, -1)} at ${url.slice(1, -1)}`, media_ids: new Array(img.media_id_string) }, (err, data, response) => {
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
        console.log(`${text}, and it has been deleted!`)
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
            console.log('file saved!')
        });
    });
}


// Testing: successfully tweets every 5 seconds
const job = new CronJob('*/5 * * * * *', () => {
    fs.readFile('data.json', (err, data) => {
        handleError(err);
        let arr = JSON.parse(data),
            url = JSON.stringify(arr.tweets[0].url);
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

