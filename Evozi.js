const https       = require('https');
const http        = require('http');
const fs          = require('fs');
const zlib        = require('zlib');
const querystring = require('querystring');

class Evozi {
    static async prerequest() {
        return new Promise(
            resolve => {
                https.get(
                    'https://apps.evozi.com/apk-downloader/',
                    res => {
                        let _data = '';
                        res.on('data', data => _data += data);
                        res.on(
                            'end',
                            _ => {
                                let csrf = _data.split('var packageguide')[1].split('\n')[1].split('= \'')[1].split('\';')[0];  //CSRF token given with the request
                                let post = _data.split('=  {')[1].split('}')[0];                                                //The object the website would POST
                                let time = post.split('t: ')[1].split(',')[0];                                                  //The time that was returned with the CSRF token
                                let pkg  = post.split(':')[0];                                                                  //What to call the packagename form key
                                let tag  = post.split(',')[2].split(':')[0].trim();                                             //What to call the CSRF form key

                                resolve({ csrf, time, pkg, tag });
                            }
                        );
                    }
                );
            }
        );
    }

    static async request(data) {
        let info = await Evozi.prerequest();
        return new Promise(
            resolve => {
                let post = {};

                post[info.pkg] = data.namespace;
                post.t         = info.time;
                post[info.tag] = info.csrf;
                post.fetch     = true;

                post = querystring.stringify(post)

                let options = {
                    hostname:   'api-apk-6.evozi.com',
                    path:       '/download',
                    method:     'POST',
                    headers:    {
                        'Content-Type':     'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept':           'application/json, text/javascript, */*; q=0.01',
                        'Accept-Encoding':  'gzip, deflate, br',
                        'Host':             'api-apk-6.evozi.com',
                        'User-Agent':       'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) QupZilla/1.9.0 Safari/538.1',
                        'Accept':           'application/json, text/javascript, */*; q=0.01',
                        'Content-Length':   Buffer.byteLength(post)
                    }
                };

                let req = http.request(
                    options,
                    res => {
                        var _data = [];
                        res.on('data', data => _data.push(data));
                        res.on(
                            'end',
                            _ => {
                                let metadata = JSON.parse(zlib.gunzipSync(_data.pop()).toString().replace('http', 'https'));

                                metadata.status === 'success'
                                    || console.error('Something went wrong downloading app metadata:\n', metadata.data)
                                    || process.exit();

                                Object.assign(metadata, info);
                                resolve(metadata);
                            }
                        );
                    }
                );

                req.write(post);
                req.end();
            }
        );
    }

    static async download(metadata, args) {
        let filename = `./${metadata.packagename}.apk`;

        return new Promise(
            resolve => {

                if (fs.existsSync(filename) && args.command !== 'install') {
                    console.warn('You already downloaded that app!');
                    process.exit();
                } else if (fs.existsSync(filename) && args.command === 'install') {
                    return resolve(true);
                }

                https.get(
                    `https:${metadata.url}`,
                    res => {
                        res.pipe(fs.createWriteStream(filename));
                        res.on('end', _ => resolve(true));
                    }
                )
            }
        )
    }
}

module.exports = Evozi;
