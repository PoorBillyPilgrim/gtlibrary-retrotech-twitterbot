require('dotenv').config();
const fs = require('fs');
const Twit = require('twit');
const request = require('request');
const data = require('./data.json');
const cron = require('node-cron')

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

// Download image from url
const downloadImage = (url, path, callback) => {
    console.log('downloading image')
    request.head(url, () => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

// Read ./images/image.png and upload to Twitter
const postTweet = (img, callback) => {
    fs.readFile(img, { encoding: 'base64' }, (err, b64content) => {
        console.log('uploading image');
        T.post('media/upload', { media_data: b64content }, (err, data, response) => {
            T.post('statuses/update', { media_ids: new Array(data.media_id_string) }, (err, data, response) => {
                if (err) {
                    console.error(err)
                }
                console.log(data);
                if (callback) {
                    callback(err);
                }
            })
        });
    })
}

// Delete ./images/image after upload
function deleteImage(img, text, callback) {
    fs.unlink(img, (err) => {
        if (err) {
            console.error(err)
        }
        console.log(`${text}, and it has been deleted!`)
    });
}

// Read data.json file, deletes the first entry, and saves the new file
const editJsonFile = (fileName, callback) => {
    fs.readFile('data.json', (err, data) => {
        console.log('file has been read')
        const arr = JSON.parse(data);
        arr.tweets.shift();
        fs.writeFile('data.json', JSON.stringify(arr), 'utf-8', (err) => {
            if (err) throw err;
            console.log('file saved!')
        });
    });
}


downloadImage(data.tweets[0].url, imgPath, () => {
    postTweet(imgPath, (err) => {
        if (err) {
            console.error(err);
        }
        deleteImage(imgPath, data.tweets[0].text);
        editJsonFile('data.json');
    })
})

// In progress: schedule Twitter uploads using cron-node module
// const task = cron.schedule('*/30 * * * *', () => {
/*

    const url = data.tweets[0].url
    const text = data.tweets[0].text

    download(url, imgPath, () => {
        postTweet(imgPath, (err) => {
            if (!err) {
                deleteImage(imgPath, text)
            }
        })
    })
})

task.start();
*/