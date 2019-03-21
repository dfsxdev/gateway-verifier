const http = require('http');
const os = require('os');
const url = require('url');

module.exports = function(path) {
    let resolve;
    let reject;
    let promise = new Promise((r, j) => {
        resolve = r;
        reject = j;
    });

    let apiUrl = url.parse(path);
    var apiHost = apiUrl.hostname;
    var apiPort = apiUrl.port || 80;
    var apiPath = apiUrl.path;

    const options = {
        method: 'GET',
        host: apiHost,
        path: apiPath,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (' + os.platform() + ' ' + os.release() + ') node/' + process.version
        }
    }

    let req = http.request(options, (response) => {
        let body = '';

        response.setEncoding('UTF-8');
        response.on('data', (data) => {
            body += data;
        })

        response.on('end', function() {
            if (response.statusCode < 400) {
                let result = null;

                try {
                    result = JSON.parse(body);
                } catch (e) {
                    result = body;
                }
                resolve(result);
            } else {
                try {
                    let result = JSON.parse(body);

                    if (result === undefined || result.error === undefined) {
                        reject({ error: 500, message: result });
                    } else {
                        if (result.error != undefined && result.error > 550) {
                            result.error = 500;
                        }
                        reject(result);
                    }
                } catch (e) {
                    reject({ error: 501, message: body });
                }
            }
        });
    });

    req.on('error', function(error) {
        reject({ error: 502, message: error.message });
    });

    req.write('');
    req.end();

    return promise;
}
