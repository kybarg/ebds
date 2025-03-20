const Debug = require('debug');
const { SerialPort } = require('serialport');
const { once, EventEmitter } = require('node:events');
const { parse, compose } = require('./utils');
const EBDSProtocolParser = require('./parser');
const commandList = require('./commands.js');
const debug = Debug('ebds:app');

class EBDS extends EventEmitter {
  constructor(param = {}) {
    super();

    this.port = undefined;
    this.ackNumber = 1;
    this.timeout = param.timeout || 3000;

    this.eventEmitter = new EventEmitter();

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

  async open(port, param = {}) {
    this.port = new SerialPort({
      path: port,
      baudRate: param.baudRate || 9600,
      dataBits: param.dataBits || 7,
      stopBits: param.stopBits || 1,
      parity: param.parity || 'even',
    });

    await Promise.race([once(this.port, 'open'), once(this.port, 'close')]);

    this.port.on('data', (buffer) => {
      this.emit('DATA_RECEIVED', {
        command: this.currentCommand,
        data: [...buffer],
        author: 'COM',
      });
    });

    this.port.on('error', (error) => {
      this.eventEmitter.emit('error', error);
    });

    this.parser = this.port.pipe(new EBDSProtocolParser());
    this.parser.on('data', (buffer) => {
      this.eventEmitter.emit('DATA', buffer);
    });

    return;
  }

  async enable() {
    const result = await this.command('ENABLE');

    if (result.success) {
      this.enabled = true;
      if (!this.polling) await this.poll(true);
    }

    return result;
  }

  async disable() {
    if (this.polling) await this.poll(false);

    const result = await this.command('DISABLE');

    if (result.success) {
      this.enabled = false;
    }

    return result;
  }

  async sendToDevice(command, txBuffer) {
    const txAck = (txBuffer[2] >> 0) & 1;
    this.processing = true;
    debug('COM <-', txBuffer.toString('hex'), command, txAck, Date.now());

    // Wait 1 second for reply.
    this.commandTimeout = setTimeout(() => {
      this.eventEmitter.emit('error', {
        success: false,
        status: 'TIMEOUT',
        command,
      });
    }, this.timeout);

    try {
      this.currentCommand = command;
      this.port.write(txBuffer);
      this.port.drain();
      this.commandSendAttempts += 1;

      const [rxBuffer] = await once(this.eventEmitter, 'DATA');

      this.processing = false;
      clearTimeout(this.commandTimeout);

      const rxAck = (rxBuffer[2] >> 0) & 1;

      debug('COM ->', rxBuffer.toString('hex'), command, rxAck, Date.now());

      if (rxAck !== txAck) throw new Error('ACK_ERROR');

      try {
        const result = parse(
          rxBuffer,
          this.currentCommand,
          this.acceptorConfig.currency,
          this.ackNumber
        );
        return result;
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      this.processing = false;
      clearTimeout(this.commandTimeout);

      // Retry sending same command
      // After 20 retries, the master will assume that the slave has crashed.
      if (this.commandSendAttempts < 20) {
        return this.sendToDevice(command, txBuffer);
      } else {
        throw {
          success: false,
          error: 'Command failed afte 20 retries',
          reason: error,
        };
      }
    }
  }

  async poll(status = null) {
    if (status === true && this.polling === true) return Promise.resolve();

    if (status === true) {
      this.polling = true;
    } else if (status === false) {
      this.polling = false;
      clearTimeout(this.pollTimeout);

      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!this.processing) {
            clearInterval(interval);
            resolve();
          }
        }, 1);
      });
    }

    if (this.polling) {
      try {
        const startTime = Date.now();
        const result = await this.command('POLL');

        if (result.info) {
          const { statuses = [] } = result.info;

          statuses.forEach((event) => {
            this.emit(event.name, event);
          });
        }
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        this.pollTimeout = setTimeout(
          () => this.poll(),
          executionTime >= 200 ? 0 : 200 - executionTime
        );

        return result;
      } catch (error) {
        this.polling = false;

        throw error;
      }
    }
  }

  async command(command, args) {
    command = command.toUpperCase();
    if (commandList[command] === undefined) {
      throw new Error('Command not found');
    }

    if (this.processing) {
      throw new Error('Already processing another command');
    }

    this.commandSendAttempts = 0;

    const buffer = compose(
      command,
      { ...this.getAcceptorConfig(), ...args },
      this.ackNumber,
      this.enabled
    );

    this.emit('DATA_SENT', { command, data: [...buffer], author: 'HOST' });
    const result = await this.sendToDevice(command, buffer);

    // update ackNumber after response received
    this.ackNumber = this.ackNumber === 0 ? 1 : 0;

    if (!result.success) {
      throw result;
    }

    return result;
  }
}

module.exports = EBDS;
