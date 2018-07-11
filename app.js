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

/**
 * Socket IO
 * @constructor
 */
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
const API_URL = 'http://35.200.33.192:8089/api';

const INTERVAL_SECOND = 1000;
const REQUEST_PER_SECOND = 10;

let TestApi;
(function (TestApi) {
    TestApi.Performance = {

        /**
         * Bulk access
         * @param data
         * @constructor
         */
        Run: function (data) {
            (async () => {
                const url = data.url;
                const method = data.method;
                const param = data.params.data;
                const requestPerSecond = data.request || 10;
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
                    let fail = 0;
                    let pass = 0;
                    for (let i = 0; i < requestPerSecond; i += 1) {
                        promises.push(new Promise((resolve) => {
                            const body = {
                                json: true,
                                data: param,
                                auth: {
                                    'bearer': user.token
                                }
                            };

                            switch (method){
                                case 'get':
                                    request.get(url, body, (err, res, body) => {
                                        if (err)
                                            fail += 1;
                                        else
                                            pass += 1;
                                        TestApi.Performance.SendData(time, pass, fail, requestPerSecond);
                                        resolve(body);
                                    });
                                break;
                                case 'post':
                                    request.post(url, body, (err, res, body) => {
                                        if (err)
                                            fail += 1;
                                        else
                                            pass += 1;
                                        TestApi.Performance.SendData(time, pass, fail, requestPerSecond);
                                        resolve(body);
                                    });
                                break;
                            }
                        }))
                    }await Promise.all(promises);
                    time += 1;
                }, INTERVAL_SECOND);
                })().then(() => {
                console.log('Test finished');
            }).catch((err) => {
                console.log(err);
            });
        },

        /**
         * Emit data to view
         * @param time
         * @param pass
         * @param fail
         * @param total_request
         * @constructor
         */
        SendData: function (time, pass, fail, total_request) {
            if (fail+pass === total_request-1){
                io.emit('test-api', {
                    request:time,
                    failed: fail,
                    successful: pass+1
                });
            }

        }
    }
})((TestApi = {}) || TestApi);


