const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser    = require('body-parser');
require('dotenv').config();

//Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Parse application/json
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

//Set port
http.listen(process.env.POST, process.env.DOMAIN);

//Show server is running on console
http.on('listening', function() {
    console.log('Express server started on port %s at %s', http.address().port, http.address().address);
});


io.on('connection', function(socket){
    console.log('Client connected...');
    socket.on('test-api', function(data){
        TestApi.Performance.Run(data);
        io.emit('test-api', data);
    });
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
const REQUEST_PER_SECOND = 10;

let TestApi;

(function (TestApi) {
    TestApi.Performance = {
        Run: function (data) {
            (async () => {
                const url = data.url;
                const method = data.method;
                const param = data.params;
                const requestPerSecond = data.request;
                const second = data.second;

                let promises = [];
                promises.push(new Promise((resolve) => {
                    request.post(`${API_URL}/auth/login`, {
                        json: true,
                        form: user
                    }, (err, res, body) => {
                        if (err) {
                            return;
                        }
                        resolve(body.access_token);
                    });
                }));

                promises = await Promise.all(promises);
                user.token = promises[0];


                let time = 1;
                setInterval(async () => {
                    promises = [];
                    //Status now

                    let fail = 0;
                    let pass = 0;
                    for (let i = 0; i < requestPerSecond; i += 1) {
                        promises.push(new Promise((resolve) => {
                            request.get(`${API_URL}/api/status_now`, {
                                json: true,
                                auth: {
                                    'bearer': user.token
                                }
                            }, (err, res, body) => {
                                if (err) {
                                    fail += 1;
                                    console.log(err);
                                    console.dir(err);
                                    return;
                                }
                                pass += 1;
                                if (i === requestPerSecond-1){
                                    io.emit('test-api', {
                                        request:time,
                                        failed: fail,
                                        successful: pass
                                    });
                                }
                                resolve(body.data);
                            });
                        }))
                    }

                    await Promise.all(promises);
                    time += 1;
                },
                    INTERVAL_SECOND);
                })().then(() => {
                console.log('Test finished');
            }).catch((err) => {
                console.log(err);
            });
        }
    }
})((TestApi = {}) || TestApi);


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
                        // io.emit('test-api', {a:1});
                        resolve(body.data);
                    });
                }))
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




// //Check chat reply
// for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
//     promises.push(new Promise((resolve => {
//         request.post(`${API_URL}/chat/reply`, {
//             json: true,
//             data: {
//                 message_id: 'ok'
//             },
//             auth: {
//                 'bearer': user.token
//             }
//         }, (err, res, body) => {
//             if (err) {
//                 console.log(err);
//                 console.log(err);
//                 return;
//             }
//             console.log(`Api ${'Chat reply is exits'} Lan thu ${time} - request thu ${i}`);
//             resolve(body.data)
//         });
//     })))
// }

//Check message is exist
// for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
//     promises.push(new Promise((resolve) => {
//         request.get(`${API_URL}/messages/check_existed/11`, {
//             json: true,
//             auth: {
//                 'bearer': user.token
//             }
//         }, (err, res, body) => {
//             if (err) {
//                 console.log(err);
//                 console.dir(err);
//                 return;
//             }
//             console.log(`Api ${'Check message is exits'} Lan thu ${time} - request thu ${i}`);
//             resolve(body.data);
//         });
//     }))
// }
//Friend recommend
// for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
//     promises.push(new Promise((resolve) => {
//         request.get(`${API_URL}/friends/recommendation`, {
//             json: true,
//             auth: {
//                 'bearer': user.token
//             }
//         }, (err, res, body) => {
//             if (err) {
//                 console.log(err);
//                 console.dir(err);
//                 return;
//             }
//             console.log(`Api ${'friend_recommend'} Lan thu ${time} - request thu ${i}`);
//             resolve(body.data);
//         });
//     }))
// }



