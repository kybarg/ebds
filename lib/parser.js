const Debug = require('debug');
const { Transform } = require('stream');
const { calculateChecksum } = require('./utils');

const debug = Debug('ubx:protocol:parser');

const PACKET_STX = 0;
const PACKET_LENGTH = 1;
const PACKET_MSG_TYPE = 2;
const PACKET_DATA = 3;
const PACKET_ETX = 4;
const PACKET_CHECKSUM = 5;

const packetTemplate = {
  stx: 0,
  length: 0,
  msgType: 0,
  data: null,
  etx: 0,
  checksum: 0,
};


class EBDSProtocolParser extends Transform {
  constructor(options) {
    super({
      ...options,
      objectMode: true,
    });

    this.buffer = Buffer.alloc(0);
    this.packet = { ...packetTemplate };
    this.dataPosition = 0;
    this.packetStartFound = false;
    this.packetState = PACKET_STX;
  }

  _transform(chunk, encoding, cb) {
    const data = Buffer.concat([this.buffer, chunk]);

    for (const [i, byte] of data.entries()) {
      if (this.packetStartFound) {
        switch (this.packetState) {
          case PACKET_LENGTH:
            if (byte >= 5) {
              this.packet.length = byte;
              this.packetState = PACKET_MSG_TYPE;
            } else {
              debug(`Unknown byte "${byte}" received at state "${this.packetState}"`);
              this.resetState();
            }
            break;

          case PACKET_MSG_TYPE:
            const highNibble = (byte & 0xF0) >> 4;
            const lowNibble = byte & 0x0F;
            if (highNibble >= 2 && highNibble <= 7 && (lowNibble === 1 || lowNibble === 0)) {
              this.packet.msgType = byte;
              this.packetState = PACKET_DATA;
            } else {
              debug(`Unknown byte "${byte}" received at state "${this.packetState}"`);
              this.resetState();
            }
            break;

          case PACKET_DATA:
            if (this.packet.data === null) {
              this.packet.data = Buffer.alloc(this.packet.length - 5);
              this.dataPosition = 0;
            }

            this.packet.data[this.dataPosition] = byte;
            this.dataPosition += 1;

            if (this.dataPosition >= this.packet.length - 5) {
              this.packetState = PACKET_ETX;
            }
            break;

          case PACKET_ETX:
            if (byte === 0x03) {
              this.packet.etx = byte;
              this.packetState = PACKET_CHECKSUM;
            } else {
              debug(`Unknown byte "${byte}" received at state "${this.packetState}"`);
              this.resetState();
            }
            break;

          case PACKET_CHECKSUM:
            this.packet.checksum = byte;
            const checksum = calculateChecksum([this.packet.length, this.packet.msgType].concat([...this.packet.data]));

            if (checksum === this.packet.checksum) {
              this.push(Buffer.from(Object.values(this.packet).reduce((accum, val) => typeof val === 'number' ? accum.concat(val) : accum.concat([...val]), [])));
            } else {
              debug(`Checksum "${checksum}" doesn't match received CheckSum "${this.packet.checksum}"`);
            }

            this.resetState();
            this.buffer = data.slice(i + 1);
            break;
          default:
            debug(`Should never reach this packetState "${this.packetState}`);
        }
      } else if (byte === 0x02) {
        this.packetStartFound = true;
        this.packet.stx = byte;
        this.packetState = PACKET_LENGTH;
      } else if (byte === 0x05 && data.length === 1) { // ENQ message
        this.push(data);
        this.resetState();
        this.buffer = data.slice(i + 1);
      } else {
        debug(`Unknown byte "${byte}" received at state "${this.packetState}"`);
      }
    }

    cb();
  }

  resetState() {
    this.packetState = 0;
    this.packet = { ...packetTemplate };
    this.dataPosition = 0;
    this.packetStartFound = false;
    this.buffer = Buffer.alloc(0);
  }

  _flush(cb) {
    this.resetState();
    cb();
  }
}

module.exports = EBDSProtocolParser;
