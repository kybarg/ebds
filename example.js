const EBDS = require('./lib/index');
const commands = require('./lib/commands');

let serialPortConfig = {
  baudrate: 9600, // default: 9600
  databits: 5, // default: 8
  stopbits: 1, // default: 2
  parity: 'none' // default: 'none'
};

let device = new EBDS();


device.on('OPEN', () => {
  console.log('Port opened!');
});

device.on('CLOSE', () => {
  console.log('Port closed!');
});

device.on('IDLING', (event) => {
  console.log(event);
});


device.open('COM30', serialPortConfig)
  .then(() => device.enable())
  .then(() => new Promise(resolve => setTimeout(resolve, 3000)))
  .then(() => device.disable())
  .then(console.log)
  // .then(() => {

  //   // Getting notest information
  //   const func = (index) => device.command('QUERY_EXPANDED_NOTE_SPECIFICATION', { index }).then((res) => {
  //     console.log(res)
  //     console.log('index', index)
  //     if (res.info.expanded.index) return func(index + 1)
  //   })

  //   return func(1)
  // })

  // .then(() => device.command('ENABLE'))
  // .then(() => device.command('QUERY_EXPANDED_NOTE_SPECIFICATION', { index: 1 }))
  // .then(() => device.command('ACCEPTOR_VARIANT_NAME'))
  // .then(() => device.command('ACCEPTOR_VARIANT_VERSION'))
  // .then(() => device.command('CASH_VALUE_IN_CASSETTE'))
  // .then(() => device.command('ACCEPTOR_TYPE'))
  // .then(() => device.command('ACCEPTOR_VARIANT_NAME'))
  // .then(() => device.command('ACCEPTOR_SERIAL_NUMBER'))
  // .then(() => device.command('DISABLE'))




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
  // .then(() => device.poll())

  .catch(error => {
    console.log(error);
  });
