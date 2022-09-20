const Debug = require('debug');
const SerialPort = require('serialport');
const EventsEmitter = require('events');
const fromEvents = require('promise-toolbox/fromEvents');
const { parse, compose } = require('./utils');
const EBDSProtocolParser = require('./parser');
const debug = Debug('ebds:app');

class EBDS extends EventsEmitter {
  constructor(param = {}) {
    super();

    this.port = undefined;
    this.ackNumber = 1;

    this.emitter = new EventsEmitter();

    this.polling = false;
    this.enabled = false;

    this.acceptorConfig = {
      currency: 'USD',
      bookmark: false,
      denominations: [1, 1, 1, 1, 1, 1, 1],
      specialInterruptMode: false,
      highSecurity: false,
      orientation: 4,
      escrowMode: true,
      noPushMode: false,
      enableBarcode: false,
      powerUpPolicy: 'A',
      expandedNoteReporting: true,
      expandedCouponReporting: true,
      ...param.acceptorConfig,
    };

    this.currentCommand = undefined;
  }

  getAcceptorConfig() {
    const config = {
      ...this.acceptorConfig,
    };
    if (!this.enabled) {
      config.denominations = [0, 0, 0, 0, 0, 0, 0];
      config.escrowMode = false;
      config.enableBarcode = false;
      config.expandedNoteReporting = false;
      config.expandedCouponReporting = false;
    }
    return config;
  }

  open(port, param = {}) {
    return new Promise((resolve, reject) => {
      this.port = new SerialPort(port, {
        baudRate: param.baudRate || 9600,
        dataBits: param.dataBits || 7,
        stopBits: param.stopBits || 1,
        parity: param.parity || 'even',
      });

      this.port.on('error', (error) => {
        reject(error);
        this.emit('ERROR');
      });

      this.port.on('close', (error) => {
        reject(error);
        this.emit('CLOSE');
      });

      this.port.on('open', () => {
        resolve();
        this.emit('OPEN');
      });

      const parser = this.port.pipe(new EBDSProtocolParser());
      parser.on('data', (buffer) => {
        debug('Received <-', Buffer.from(buffer));

        const result = parse(
          buffer,
          this.currentCommand,
          this.acceptorConfig.currency,
          this.ackNumber
        );
        const { success } = result;
        if (this.timeoutId) clearTimeout(this.timeoutId);

        if (success) {
          this.emitter.emit('SUCCESS', result);
        } else {
          this.emitter.emit('ERROR', result);
        }
      });
    });
  }

  poll(start) {
    if (start) {
      return new Promise((resolve, reject) => {
        this.pollInterval = setInterval(() => {
          this.polling = true;
          this.exec('POLL')
            .then((res) => {
              resolve();
              const { statuses = [] } = res.info;

              statuses.forEach((event) => {
                this.emit(event.name, event);
              });
            })
            .catch((error) => {
              reject();
              this.emit('ERROR', error);
            })
            .finally(() => {
              this.emitter.emit('POLL_STOP');
              this.polling = false;
            });
        }, 200);
      });
    } else {
      return new Promise((resolve) => {
        if (this.polling) {
          this.emitter.once('POLL_STOP', () => {
            resolve();
          });
        } else {
          clearInterval(this.pollInterval);
          resolve();
        }
      });
    }
  }

  getAck() {
    this.ackNumber = this.ackNumber === 0 ? 1 : 0;
    return this.ackNumber;
  }

  exec(command, args) {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    const buffer = compose(
      command,
      { ...this.getAcceptorConfig(), ...args },
      this.getAck(),
      this.enabled
    );
    debug('Sent ->', buffer);

    this.port.write(buffer);
    this.port.drain(() => {
      this.timeoutId = setTimeout(() => {
        this.currentCommand = null;
        this.emitter.emit('TIMED_OUT', {
          success: false,
          command: command,
          info: {
            error: 'TIMED_OUT',
            message: 'No response in 3s',
          },
        });
      }, 3000);
    });

    return new Promise((resolve, reject) => {
      fromEvents(this.emitter, ['SUCCESS'], ['ERROR', 'TIMED_OUT']).then(
        (event) => {
          resolve(...event.args);
        },
        (event) => {
          reject(...event.args);
        }
      );
    });
  }

  command(command, args) {
    this.currentCommand = command;

    if (this.enabled) {
      return this.poll(false)
        .then(() => this.exec(command, args))
        .then((res) => {
          if (!this.polling) this.poll(true);
          return res;
        });
    }

    return this.exec(command, args);
  }

  enable() {
    return this.command('ENABLE').then((res) => {
      this.enabled = true;
      this.poll(true);
      return res;
    });
  }

  disable() {
    return this.command('DISABLE').then((res) => {
      this.enabled = false;
      this.poll(false);
      return res;
    });
  }
}

module.exports = EBDS;
