const io = require('socket.io-client');
const request = require('request');
const accounts = require('./account');


const CHAT_URL = 'https://prototype-chat.robin-aisystem.com';
const API_URL = 'http://35.200.33.192:8089';

const INTERVAL_SECOND = 1000;
const REQUEST_PER_SECOND = 120;
const user = {
    username: "quang0212083@gmail.com",
    password: "quang0168214",
    grant_type: "password",
    client_id: "40826416009628295844970703114480",
    client_secret: "DcJB4ok4inz0oninX6RE6M6Np8nhXnu4",
    Authorization: "Bearer"
};
(async () => {
  //-- get users' tokens and ids
  console.log('fetching users\' ids and tokens');
  let promises = [];
  promises.push(new Promise((resolve) => {
    request.post(`${API_URL}/api/auth/login`, {
      json: true,
      form: user
    }, (err, res, body) => {
      if (err) {
        console.log(err);
        return;
      }
      // console.log(`user ${users.indexOf(user)}: ${user.usercode} logged in`);
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
    for (let i = 0; i < REQUEST_PER_SECOND; i += 1) {
      promises.push(new Promise((resolve) => {
        // console.log('udevice', udevice);
        request.get(`${API_URL}/api/users/me`, {
          json: true,
          auth: {
            'bearer': user.token
          }
        }, (err, res, body) => {
          if (err) {
            console.log(err);
            return;
          }
          // if(body.status && body.status === 200) {
            //Time : Lần số bao nhiêu (1 lần trong vòng 1 giây)
            //i : số lần trong 1 time
            console.log(`Lan thu ${time} - request thu ${i}`);
          // } else{
          //   console.log(body);
          // }
          resolve(body.data);
        });
      }))
    }
    await Promise.all(promises);
    time += 1;
  }, INTERVAL_SECOND);
})()
  .then(() => {
    console.log('Test finished');
  })
  .catch((err) => {
    console.log(err);
  });

