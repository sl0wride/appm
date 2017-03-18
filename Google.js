const https = require('https');

class Google {
    static async query(query) {
        return new Promise(
            resolve => {
                https.get(
                    `https://play.google.com/store/search?q=${query}&c=apps`,
                    res => {
                        var _data = '';
                        res.on('data', data => _data += data);
                        res.on(
                            'end',
                            _ => {
                                let list = _data.split('a class="title"')
                                    .map(
                                        line => (
                                            {
                                                link:       line.split('" title="')[0].split('href="')[1],
                                                title:      line.split('" aria-hidden="true"')[0].split('title="')[1],
                                                namespace:  line.split('" title="')[0].split('href="')[1].split('id=')[1]
                                            }
                                        )
                                    );

                                list.splice(0, 1);

                                resolve(list);
                            }
                        );
                    }
                );
            }
        );
    }
}

module.exports = Google;
