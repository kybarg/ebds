const EBDS = require('./lib/index');
const commands = require('./lib/commands');

let serialPortConfig = {
  baudrate: 9600, // default: 9600
  databits: 8, // default: 8
  stopbits: 2, // default: 2
  parity: 'none' // default: 'none'
};

let device = new EBDS();


device.on('OPEN', () => {
  console.log('Port opened!');
});

device.on('CLOSE', () => {
  console.log('Port closed!');
});


device.open('COM20', serialPortConfig)
  // .then(() => device.command('SYNC'))
  // .then(() => device.command('HOST_PROTOCOL_VERSION', { version: 6 }))
  // .then(() => device.initEncryption())
  // .then(() => device.command('GET_SERIAL_NUMBER'))
  // .then(result => {
  //   console.log('SERIAL NUMBER:', result.info.serial_number);
  //   return;
  // })
  // .then(() => device.command('SETUP_REQUEST'))
  // .then(result => {
  //   for (let i = 0; i < result.info.channel_value.length; i++) {
  //     channels[result.info.channel_value[i]] = {
  //       value: result.info.expanded_channel_value[i],
  //       country_code: result.info.expanded_channel_country_code[i]
  //     };
  //   }
  //   return;
  // })
  // .then(() => device.command('SET_DENOMINATION_ROUTE', { route: 'payout', value: 10000, country_code: 'RUB' }))
  // .then(() => device.enable())
  .then(() => device.poll())
  .then(() => {

    // Object.keys(commands).reduce((accumulatorPromise, commmand) => {
    //   return accumulatorPromise.then(() => {
    //     return new Promise(resolve => setTimeout(() => {
    //       console.log('-------------------------')
    //       console.log(commmand)
    //       device.command(commmand);
    //       resolve();
    //     }, 1000))
    //   });
    // }, Promise.resolve());

    // device.command('SETUP')

    // setInterval(() => {
    //   device.command('ACCEPTOR_TYPE')
    //   // device.command('ACCEPTOR_SERIAL_NUMBER')
    // }, 2000)
  })
  .catch(error => {
    console.log(error);
  });
