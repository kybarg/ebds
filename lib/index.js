const SerialPort = require('serialport');
const EventsEmitter = require('events');
const fromEvent = require('promise-toolbox/fromEvent')
const { parse, compose } = require('./utils');
const EBDSProtocolParser = require('./parser')

class EBDS extends EventsEmitter {
  constructor(param = {}) {
    super();

    this.port = undefined;
    this.ACK_NUMBER = 0;

    this.emitter = new EventsEmitter();

    this.enabled = false;



    this.acceptorConfig = {
      denominations: [1, 1, 1, 1, 1, 1, 1],
      interruptMode: false,
      highSecurity: false,
      orientation: 4,
      escrowMode: false,
      noPushMode: false,
      enableBarcode: false,
      enablePowerUpB: false,
      enablePowerUpC: false,
      extendedNoteReporting: false,
      ...param.acceptorConfig,
    };

    this.currentCommand = undefined;
  }

  getAcceptorConfig() {
    const config = {
      ...this.acceptorConfig,
    }
    if (!this.enabled) {
      config.denominations = [0, 0, 0, 0, 0, 0, 0];
      config.enableBarcode = false;
    }
    return config
  }

  open(port, param = {}) {
    return new Promise((resolve, reject) => {
      this.port = new SerialPort(port, {
        baudRate: param.baudRate || 9600,
        databits: param.databits || 7,
        stopbits: param.stopbits || 1,
        parity: param.parity || 'even',
        autoOpen: true
      });

      this.port.on('error', (error) => {
        reject(error);
        this.emit('CLOSE');
      });

      this.port.on('close', (error) => {
        reject(error);
        this.emit('CLOSE');
      });

      this.port.on('open', () => {
        resolve();
        this.emit('OPEN');
      });

      const parser = this.port.pipe(new EBDSProtocolParser())
      parser.on('data', buffer => {
        console.log('Received <-', Buffer.from(buffer));
        console.log(parse(buffer, this.currentCommand))
        this.ACK_NUMBER = this.ACK_NUMBER ? 0 : 1;
      })
    });
  }


  poll() {
    setInterval(() => {
      this.currentCommand = 'POLL'
      const buffer = compose('POLL', this.getAcceptorConfig(), this.ACK_NUMBER);
      console.log('Sent ->', buffer)
      this.port.write(buffer, () => {
        this.port.drain();
      })

    }, 2000);
  }


  command(command) {
    this.currentCommand = command

    const buffer = compose(command, this.getAcceptorConfig(), this.ACK_NUMBER, this.enabled);
    console.log('Sent ->', buffer)
    this.port.write(buffer, () => {
      this.port.drain();
    })
    // return fromEvent(emitter, "foo", {
    //   // whether the promise resolves to an array of all the event args
    //   // instead of simply the first arg
    //   array: false,

    //   // whether the error event can reject the promise
    //   ignoreErrors: false,

    //   // name of the error event
    //   error: "error",
    // });

    // promise.then(
    //   value => {
    //     console.log("foo event was emitted with value", value);
    //   },
    //   reason => {
    //     console.error("an error has been emitted", reason);
    //   }
    // );
  }

  enable() {
    this.enabled = true;
    this.command('ENABLE')
  }

  disable() {
    this.enabled = false;
    this.command('DISABLE')
  }
}


module.exports = EBDS
