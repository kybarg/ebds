const EBDS = require('./lib/index')
const commands = require('./lib/commands')

let serialPortConfig = {
  baudrate: 9600, // default: 9600
  databits: 7, // default: 8
  stopbits: 1, // default: 2
  parity: 'even', // default: 'none'
}

let device = new EBDS({
  acceptorConfig: {
    escrowMode: false,
  },
})

device.on('OPEN', () => {
  console.log('Port opened!')
})

device.on('CLOSE', () => {
  console.log('Port closed!')
})

device.on('IDLING', event => {
  console.log(event)
})

device.on('ACCEPTING', event => {
  console.log(event)
})

device.on('ESCROWED', event => {
  console.log(event)
})

device.on('STACKING', event => {
  console.log(event)
})

device.on('STACKED', event => {
  console.log(event)
})

device.on('RETURNING', event => {
  console.log(event)
})

device.on('RETURNED', event => {
  console.log(event)
})

device.on('CHEATED', event => {
  console.log(event)
})

device.on('REJECTED', event => {
  console.log(event)
})

device.on('JAMMED', event => {
  console.log(event)
})

device.on('CASSETTE_FULL', event => {
  console.log(event)
})

device.on('LRC_REMOVED', event => {
  console.log(event)
})

device.on('PAUSED', event => {
  console.log(event)
})

device.on('CALIBRATION', event => {
  console.log(event)
})

device.on('POWER_UP', event => {
  console.log(event)
})

device.on('INVALID_COMMAND', event => {
  console.log(event)
})

device.on('FAILURE', event => {
  console.log(event)
})

device.on('NO_PUSH_MODE', event => {
  console.log(event)
})

device.on('FLASH_DOWNLOAD', event => {
  console.log(event)
})

device.on('PRESTACK', event => {
  console.log(event)
})

device.on('ERROR', event => {
  console.log(event)
})

device
  .open('COM20')
  // .then(() => device.command('RETURN'))
  .then(() => device.enable())
  .then(console.log)
  // .then(() => new Promise(resolve => setTimeout(resolve, 3000)))
  // .then(() => device.disable())
  // // .then(console.log)
  // .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
  // .then(() => device.enable())
  // // .then(console.log)
  // .then(() => new Promise(resolve => setTimeout(resolve, 3000)))
  // .then(() => device.disable())
  // .then(console.log)

  // .then(() => new Promise(resolve => setTimeout(resolve, 10000)))
  // .then(() => device.enable())
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
    console.log(error)
  })
