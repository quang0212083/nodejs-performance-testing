const io            = require('socket.io-client');
const express       = require('express');
const http          = require('http');
const bodyParser    = require('body-parser');
require('dotenv').config();


//Call framework
const app = express();
const server = http.createServer(app);

//Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Parse application/json
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

//Set port
server.listen(process.env.POST, process.env.DOMAIN);

//Show server is running on console
server.on('listening', function() {
    console.log('Express server started on port %s at %s', server.address().port, server.address().address);
});

//Show form update data
app.get('/', function (request, response) {
    response.render('index');
});

const request = require('request');
const user = require('./account');

const CHAT_URL = 'https://prototype-chat.robin-aisystem.com';
const API_URL = 'http://35.200.33.192:8089/api';

const INTERVAL_SECOND = 1000;
const REQUEST_PER_SECOND = 50;

app.get('/test-api', function(req, res) {
    (async () => {
        //-- get users' tokens and ids
        console.log('fetching users\' ids and tokens');
        let promises = [];
        promises.push(new Promise((resolve) => {
            request.post(`${API_URL}/auth/login`, {
                json: true,
                form: user
            }, (err, res, body) => {
                if (err) {
                    console.log(err);

                    return;
                }
                console.log(body);
                resolve(body.access_token);
            });
        }));
        promises = await Promise.all(promises);
        console.log('get token');
        user.token = promises[0];
        console.log(user);
        console.log('get profile');
        let time = 1;
        setInterval(async () => {
            promises = [];

            //Status now
            for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
                promises.push(new Promise((resolve) => {
                    request.get(`${API_URL}/api/status_now`, {
                        json: true,
                        auth: {
                            'bearer': user.token
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            console.dir(err);
                            return;
                        }
                        console.log(`Api ${'status_now'} Lan thu ${time} - request thu ${i}`);
                        resolve(body.data);
                    });
                }))
            }
            console.log('         ');

            //Friend recommend
            for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
                promises.push(new Promise((resolve) => {
                    request.get(`${API_URL}/friends/recommendation`, {
                        json: true,
                        auth: {
                            'bearer': user.token
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            console.dir(err);
                            return;
                        }
                        console.log(`Api ${'friend_recommend'} Lan thu ${time} - request thu ${i}`);
                        resolve(body.data);
                    });
                }))
            }
            console.log('         ');

            //Check message is exist
            for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
                promises.push(new Promise((resolve) => {
                    request.get(`${API_URL}/messages/check_existed/11`, {
                        json: true,
                        auth: {
                            'bearer': user.token
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            console.dir(err);
                            return;
                        }
                        console.log(`Api ${'Check message is exits'} Lan thu ${time} - request thu ${i}`);
                        resolve(body.data);
                    });
                }))
            }
            console.log('         ');

            //Check chat reply
            for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
                promises.push(new Promise((resolve => {
                    request.post(`${API_URL}/chat/reply`, {
                        json: true,
                        data: {
                            message_id: 'ok'
                        },
                        auth: {
                            'bearer': user.token
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            console.log(err);
                            return;
                        }
                        console.log(`Api ${'Chat reply is exits'} Lan thu ${time} - request thu ${i}`);
                        resolve(body.data)
                    });
                })))
            }

            await Promise.all(promises);
            time += 1;
        }, INTERVAL_SECOND);
    })().then(() => {
        console.log('Test finished');
    }).catch((err) => {
        console.log(err);
    });
});







