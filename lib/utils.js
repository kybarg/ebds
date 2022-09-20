const states = require('./states');
const commands = require('./commands');
const models = require('./models');
const currencies = require('./currencies');

// function bitGet(number, bitPosition) {
//   return (number & (1 << bitPosition)) === 0 ? 0 : 1;
// }

function bitTest(num, bit) {
  return (num >> bit) % 2 !== 0;
}

function bitSet(num, bit) {
  return num | (1 << bit);
}

function bitClear(num, bit) {
  return num & ~(1 << bit);
}

// function bitToggle(num, bit) {
//   return bit_test(num, bit) ? bit_clear(num, bit) : bit_set(num, bit);
// }

function bitExtract(num, count, position) {
  return ((1 << count) - 1) & (num >> position);
}

// The checksum is calculated on all bytes between the STX and the ETX (excluding the STX and the ETX)
function calculateChecksum(bufer) {
  return [...bufer].reduce((accum, value) => accum ^ value, 0);
}

function readField16(bufer, field) {
  return parseInt(
    bufer
      .slice(field * 4, field * 4 + 4)
      .reduce((accum, val) => accum + (val & 0x0f).toString(16), ''),
    16
  );
}

function readField32(bufer, field) {
  return parseInt(
    bufer
      .slice(field * 8, field * 8 + 8)
      .reduce((accum, val) => accum + (val & 0x0f).toString(32), ''),
    16
  );
}

// function hex_to_ascii(str1) {
//   var hex = str1.toString();
//   var str = '';
//   for (var n = 0; n < hex.length; n += 2) {
//     str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
//   }
//   return str;
// }

function parse(bufer, currentCommand, currency = 'USD', ackNumber) {
  // const STX = bufer[0];
  const LENGTH = bufer[1];
  const CTL = bufer[2];
  let DATA = bufer.slice(3, LENGTH - 2);
  // const ETX = bufer[9];
  const CHEHCKSUM = bufer[bufer.length - 1];
  const MESSAGE_TYPE = (CTL & 0xf0) >> 4;
  const ACK_NUMBER = (CTL >> 0) & 1;

  let result = {
    success: true,
    command: currentCommand,
    info: {},
  };

  if (ACK_NUMBER !== ackNumber) {
    result.success = false;
    result.info.error = 'ACK_ERROR';
    result.info.message = 'Ack number is wrong, try to send command again';
    return result;
  }

  // const command = commands[currentCommand];

  const checksum = calculateChecksum([LENGTH, CTL].concat([...DATA]));

  if (CHEHCKSUM !== checksum) {
    result.success = false;
    result.info.error = 'CHEHCKSUM_ERROR';
    result.info.message = 'Checksum is failed';
    return result;
  }

  // if (LENGTH !== command.responseLength) {
  //   result.success = false;
  //   result.info.error = 'Invalid response length';
  //   return result;
  // }

  if (MESSAGE_TYPE === 2 || MESSAGE_TYPE === 7) {
    if (MESSAGE_TYPE === 7) {
      DATA = DATA.slice(1, DATA.length);
    }

    result.info = {
      idling: bitTest(DATA[0], 0),
      accepting: bitTest(DATA[0], 1),
      escrowed: bitTest(DATA[0], 2),
      stacking: bitTest(DATA[0], 3),
      stacked: bitTest(DATA[0], 4),
      returning: bitTest(DATA[0], 5),
      returned: bitTest(DATA[0], 6),

      cheated: bitTest(DATA[1], 0),
      rejected: bitTest(DATA[1], 1),
      jammed: bitTest(DATA[1], 2),
      cassetteFull: bitTest(DATA[1], 3),
      lrcInstalled: bitTest(DATA[1], 4),
      paused: bitTest(DATA[1], 5),
      calibration: bitTest(DATA[1], 6),

      powerUp: bitTest(DATA[2], 0),
      invalidCommand: bitTest(DATA[2], 1),
      failure: bitTest(DATA[2], 2),
      billValue: currencies[currency][bitExtract(DATA[2], 3, 3)],

      stalled: bitTest(DATA[3], 0),
      flashDownload: bitTest(DATA[3], 1),
      prestack: bitTest(DATA[3], 2),
      barcodeSupport: bitTest(DATA[3], 3),
      allowsDeviceCaps: bitTest(DATA[3], 4),

      model: models[DATA[4]] || DATA[4],
      codeRevision: DATA[5],
    };

    if (MESSAGE_TYPE === 7) {
      const EXPANDED_DATA = Buffer.from(DATA.slice(6, DATA.length));
      result.info.expanded = {
        index: parseInt(EXPANDED_DATA[0], 16),
        isoCode: EXPANDED_DATA.slice(1, 4).toString('ascii'),
        baseValue: parseInt(EXPANDED_DATA.slice(4, 7).toString('ascii')),
        sign: EXPANDED_DATA.slice(7, 8).toString('ascii'),
        exponent: parseInt(EXPANDED_DATA.slice(8, 10).toString('ascii')),
        orientation: parseInt(EXPANDED_DATA[10], 16),
        type: EXPANDED_DATA.slice(11, 12).toString('ascii'),
        series: EXPANDED_DATA.slice(12, 13).toString('ascii'),
        compatibility: EXPANDED_DATA.slice(13, 14).toString('ascii'),
        version: EXPANDED_DATA.slice(14, 15).toString('ascii'),
      };
    }

    const resultStates = states.filter(
      ({ byte, bit, negative }) => bitTest(DATA[byte], bit) === !negative
    );

    result.info.statuses = resultStates.map(
      ({ name, description, denomination, type }) => {
        const res = { name, description, type };
        if (denomination) {
          res.info = {
            denomination: currencies[currency][bitExtract(DATA[2], 3, 3)],
            currency,
          };
          if (MESSAGE_TYPE === 7) {
            let denomination =
              result.info.expanded.baseValue *
              Math.pow(10, result.info.expanded.exponent);
            if (result.info.expanded.sign === '-')
              denomination =
                result.info.expanded.baseValue /
                Math.pow(10, result.info.expanded.exponent);

            res.info = {
              denomination,
              currency,
            };
          }
        }

        return res;
      }
    );
  }

  if (MESSAGE_TYPE === 6) {
    if (currentCommand === 'SOFTWARE_CRC') {
      result.info.value = DATA.slice(0, 4).reduce(
        (accum, val) => accum + (val & 0x0f).toString(16),
        '0x'
      );
    } else if (currentCommand === 'CLEAR_CASH_VALUE_IN_CASSETTE') {
      result.info.value = parseInt(
        DATA.reduce((accum, val) => accum + (val & 0x0f).toString(24), ''),
        16
      );
    } else if (
      [
        'ACCEPTOR_SERIAL_NUMBER',
        'ACCEPTOR_BOOT_SOFTWARE_VERSION',
        'ACCEPTOR_APPLICATION_SOFTWARE_VERSION',
        'ACCEPTOR_VARIANT_VERSION',
        'ACCEPTOR_VARIANT_NAME',
        'ACCEPTOR_TYPE',
      ].includes(currentCommand)
    ) {
      result.info.value = Buffer.from(DATA)
        .toString()
        .replace(/[^\x20-\x7E]/g, '');
    } else if (
      ['CASH_VALUE_IN_CASSETTE', 'NUMBER_OF_ACCEPTOR_RESETS'].includes(
        currentCommand
      )
    ) {
      result.info.value = DATA.reduce((accum, val) => accum + (val & 0x0f), 0);
    } else if (currentCommand === 'ACCEPTOR_AUDIT_LIFE_TIME_TOTALS') {
      result.info = {
        performanceDataMapID: readField32(DATA, 0),
        totalOperatingHours: readField32(DATA, 1),
        totalMotorStarts: readField32(DATA, 2),
        totalDocumentsReachedEscrowPosition: readField32(DATA, 3),
        totalDocumentsPassedRecognition: readField32(DATA, 4),
        totalDocumentsPassedValidation: readField32(DATA, 5),
      };
    } else if (currentCommand === 'ACCEPTOR_AUDIT_QP_MEASURES') {
      result.info = {
        last100BillsAcceptRate: readField16(DATA, 0),
        totalMotorStarts: readField16(DATA, 1),
        totalDocumentsStacked: readField16(DATA, 2),
        totalDocumentsReachedEscrowPosition: readField16(DATA, 3),
        totalDocumentsPassedRecognition: readField16(DATA, 4),
        totalDocumentsPassedValidation: readField16(DATA, 5),
        totalRecognitionRejections: readField16(DATA, 6),
        totalSecurityRejections: readField16(DATA, 7),
        totalOrientationDisabledRejections: readField16(DATA, 8),
        totalDocumentDisabledRejections: readField16(DATA, 9),
        totalFastFeedRejectionRejections: readField16(DATA, 10),
        totalDocumentsInsertedwhileDisabled: readField16(DATA, 11),
        totalHostReturnDocumentRejections: readField16(DATA, 12),
        totalBarcodesDecoded: readField16(DATA, 13),
      };
    } else if (
      currentCommand === 'ACCEPTOR_AUDIT_GENERAL_PERFORMANCE_MEASURES'
    ) {
      result.info = {
        totalCrossChannel0Rejects: readField16(DATA, 0),
        totalCrossChannel1Rejects: readField16(DATA, 1),
        totalSumofAllJams: readField16(DATA, 2),
        totalJamRecoveryEfforts: readField16(DATA, 3),
        totalRejectAttemptsFollowedbyJam: readField16(DATA, 4),
        totalStackerJams: readField16(DATA, 5),
        totalJamswithoutRecoveryEnabled: readField16(DATA, 6),
        totalOutOfServiceConditions: readField16(DATA, 7),
        totalOutOfOrderConditions: readField16(DATA, 8),
        totalOperatingHours: readField16(DATA, 9),
        totalDocumentsExceedingMaxLength: readField16(DATA, 10),
        totalDocumentsunderMinLength: readField16(DATA, 11),
        totalDocumentsFailedToReachEscrowPosition: readField16(DATA, 12),
        totalCalibrations: readField16(DATA, 13),
        totalPowerups: readField16(DATA, 14),
        totalDownloadAttempts: readField16(DATA, 15),
        totalCassettesFull: readField16(DATA, 16),
        totalCassettesRemoved: readField16(DATA, 17),
      };
    }
  }

  // 02 1e 70 02 01 10 00 10 55 35 01 55 53 44 30 30 31 2b 30 30 00 43 41 44 42 00 00 00 03 50

  if (result.info.invalidCommand || result.info.failure) {
    result.success = false;
  }

  return result;
}

// STX LENGTH MSG_TYPE DATA ETX CHECK_SUM
function compose(commandName, args = {}, ACK_NUMBER = 0) {
  const { data, type, subtype } = commands[commandName];
  let DATA = data;

  if (type === 0x10 || type === 0x70) {
    args.denominations.forEach((set, bit) => {
      if (set) DATA[0] = bitSet(DATA[0], bit);
    });
    if (args.specialInterruptMode) DATA[1] = bitSet(DATA[1], 0);
    if (args.highSecurity) DATA[1] = bitSet(DATA[1], 1);
    if (args.orientation) {
      switch (args.orientation) {
        case 1:
          DATA[1] = bitClear(DATA[1], 2);
          DATA[1] = bitClear(DATA[1], 3);
          break;
        case 2:
          DATA[1] = bitSet(DATA[1], 2);
          DATA[1] = bitClear(DATA[1], 3);
          break;
        case 4:
          DATA[1] = bitSet(DATA[1], 2);
          DATA[1] = bitSet(DATA[1], 3);
          break;
      }
    }
    if (args.escrowMode) DATA[1] = bitSet(DATA[1], 4);
    if (args.noPushMode) DATA[2] = bitSet(DATA[2], 0);
    if (args.powerUpPolicy === 'B') {
      bitSet(DATA[2], 2);
    } else if (args.powerUpPolicy === 'C') {
      bitSet(DATA[2], 3);
    }
    if (args.expandedNoteReporting) DATA[2] = bitSet(DATA[2], 4);
    if (args.expandedCouponReporting) DATA[2] = bitSet(DATA[2], 5);

    if (commandName === 'ENABLE') {
      if (args.denominations.includes(1)) {
        args.denominations.forEach((set, bit) => {
          if (set) DATA[0] = bitSet(DATA[0], bit);
        });
      } else DATA[0] = 0x7f;
      if (args.enableBarcode) DATA[2] = bitSet(DATA[2], 1);
    } else if (commandName === 'DISABLE') {
      DATA[0] = 0x00;
      DATA[2] = bitClear(DATA[2], 1);
    } else if (commandName === 'STACK') {
      DATA[1] = bitSet(DATA[1], 5);
    } else if (commandName === 'RETURN') {
      DATA[1] = bitSet(DATA[1], 6);
    }
  }

  if (type === 0x70) {
    DATA = [subtype, ...DATA];

    if (subtype === 0x02) {
      DATA = [...DATA, args.index];
    }
  }

  const STX = 0x02;
  const ETX = 0x03;
  const LENGTH = 5 + DATA.length; // STX+LENGTH+MSG_TYPE+ETX+CHECKSUM=5 + DATA
  const MSG_TYPE = type | (ACK_NUMBER & 0xf);
  const buffer = [STX, LENGTH, MSG_TYPE].concat(DATA, ETX);
  const CHECKSUM = calculateChecksum(buffer.slice(1, -1));
  buffer.push(CHECKSUM);
  return Buffer.from(buffer);
}

module.exports = { parse, calculateChecksum, compose };
