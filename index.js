require('dotenv').config();
const fs = require('fs');
const Twit = require('twit');
const request = require('request');
const data = require('./data.json');

/** App originally could not connect with history.library.gatech.edu 
 *  because intermediate certificates were not bundled in the certificate chain
 *  I had to go download the certs
 *  I then bundled them manually by using the ssl-root-cas module
 *  Docs: https://www.npmjs.com/package/ssl-root-cas
 */
const rootCas = require('ssl-root-cas/latest').create();
rootCas
    .addFile(__dirname + '/ssl/intermediate-01.pem')
    .addFile(__dirname + '/ssl/intermediate-02.pem');
require('https').globalAgent.options.ca = rootCas;



const T = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const imgPath = './images/image.png'
const url = 'https://history.library.gatech.edu/files/original/8da0b7a926427a61f99a5aa5ec79f779.jpg'


const download = (url, path, callback) => {
    console.log('downloading image')
    request.head(url, () => {
        // I think it is so that you can log errors if wanted
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

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


function deleteImage(img, text, callback) {
    fs.unlink(img, (err) => {
        if (err) {
            console.error(err)
        }
        console.log(`${text}, and it has been deleted!`)
    });
}

// Successfully downloads image from url
// Then uploads to Twitter
// Then deletes from local file system 
download(url, imgPath, () => {
    postTweet(imgPath, (err) => {
        if (!err) {
            deleteImage(imgPath, 'this is photo 1')
        }
    })
})

