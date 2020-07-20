const axios = require('axios');
const fs = require('fs');
const { delayReject, delayThen, delayCatch } = require('delay.ts');

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

// Grabbed this func from https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
async function downloadImage(url, pathToImg) {

    const writeStream = fs.createWriteStream(pathToImg)

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
const img = './images/image.png'


// Using this chain has successfully showed that the image does download,
// and then it is deleted 3 seconds later
downloadImage(url, img).then(delayThen(3000)).then(() =>
    fs.unlink(img, (err) => {
        if (err) {
            console.error(err);
        }
        console.log('image deleted!')
    })
);