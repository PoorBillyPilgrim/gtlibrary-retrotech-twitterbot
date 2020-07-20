require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const Twit = require('twit');
const { delayReject, delayThen, delayCatch } = require('delay.ts');

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

T.post('statuses/update', { status: 'Look, I am tweeting again!' }, function (err, data, response) {
    console.log(data)
});




const delay = () => {
    return new Promise(resolve => {
        setTimeout(resolve, 3000);
    });
}

// Grabbed this func from https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
async function downloadImage(url, imgPath) {

    const writeStream = fs.createWriteStream(imgPath)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    // How axios writes image to pathToImg
    response.data.pipe(writeStream)

    return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject)
        console.log('image downloaded!')
    })
}

const url = 'https://history.library.gatech.edu/files/original/8da0b7a926427a61f99a5aa5ec79f779.jpg'
const imgPath = './images/image.png'

// Need to create an async delete func
function deleteImage(img, text) {
    return new Promise((resolve, reject) => {
        fs.unlink(img, (err) => {
            if (err) {
                reject(err)
            }
            resolve(`${text}, and it has been deleted!`)
        });
    })
}
/*
for (let i = 0; i < data.tweets.length; i++) {
    downloadImage(data.tweets[i].url, imgPath).then(() =>
        fs.unlink(imgPath, (err) => {
            if (err) {
                console.error(err);
            }
            console.log(`${data.tweets[i].text}, and it has been deleted!`)
        })
    ).catch(err => console.error(err));
}
downloadImage(data.tweets[0].url, imgPath)
    .then(deleteImage(imgPath, data.tweets[0].text))
    .catch(err => console.error(err))
    */

/*
for (let i = 0; i < data.tweets.length; i++) {
    // Using this chain has successfully showed that the image does download,
    // and then it is deleted 3 seconds later
    downloadImage(data.tweets[i].img, img).then(delayThen(3000)).then(() =>
        fs.unlink(img, (err) => {
            if (err) {
                console.error(err);
            }
            console.log(`${data.tweets[i].text}, and it has been deleted!`)
        })
    ).catch(err => console.error(err));
}
*/