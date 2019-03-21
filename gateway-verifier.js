module.exports = function(config) {
    const express = require('express');
    const session = require('express-session');
    const RedisStore = require('connect-redis')(session);
    const svgCaptcha = require('svg-captcha');
    const bodyParser = require('body-parser');
    const request = require('./model/request');
    const urlParser = require('url');
    const path = require('path');
    const app = express();

    // view engine
    app.set('views', path.join(__dirname, '/template'));
    app.engine('html', require('ejs').__express);
    app.set('view engine', 'html');

    // static resources mouth
    app.use(express.static(path.join(__dirname, '/client'), { maxAge: 10800000 }));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false, limit: '1024kb' }));

    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: 'gateway-verify',
        name: 'gateway-verify-sid',
        store: new RedisStore({
            host: config.redisHost,
            port: config.redisPort,
            logErrors: true
        })
    }));

    // redirect to view
    app.get('', (req, res) => {
        let uri = req.query.uri;
        if (uri) {
            req.session.uri = uri;
            req.session.redirect = req.query.returi || uri;
            req.session.ip = req.headers['x-real-ip'] || req.ip.match(/\d+\.\d+\.\d+\.\d+/);        
            res.redirect(req.baseUrl + '/');
        } else {
            res.render('verify', {title: config.title});
        }
    });

    // get verifier code
    app.get('/verifier-code', (req, res) => {
        // 获取验证码
        var captcha = svgCaptcha.create({
            size: 6,
            noise: 6,
            color: true,
            background: '#cc9966'
        });

        req.session.captcha = captcha.text;
        res.type('svg');
        res.status(200).send(captcha.data);
    });

    // check code
    app.post('/check-code', (req, res) => {
        let code = req.body.code.toLowerCase();
        let captcha = req.session.captcha.toLowerCase();

        let url = urlParser.format({
            protocol: req.protocol,
            host: req.hostname,
            pathname: config.verifyPath,
            search: '?ip=' + req.session.ip + '&uri=' + req.session.uri + '&action=verify-pass'
        });

        let redirect = req.session.redirect;

        // 验证解禁
        if (code === captcha) {
            request(url)
                .then((rs) => {
                    req.session.destroy();
                    res.status(200)
                        .json({
                            redirect: redirect
                        })
                        .end();
                })
                .catch(error => {
                    res.status(error.error || 500)
                        .json(error)
                        .end();
                })
        } else {
            res.status(500)
                .json({
                    error: 500,
                    message: '验证码错误,请重新输入'
                })
                .end();
        }
    });

    return app;
}
