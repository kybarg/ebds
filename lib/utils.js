const states = require('./states');
const commands = require('./commands');
const models = require('./models');

function bitGet(number, bitPosition) {
  return (number & (1 << bitPosition)) === 0 ? 0 : 1;
}

function bitTest(num, bit) {
  return ((num >> bit) % 2 !== 0)
}

function bitSet(num, bit) {
  return num | 1 << bit;
}

function bitClear(num, bit) {
  return num & ~(1 << bit);
}

function bitToggle(num, bit) {
  return bit_test(num, bit) ? bit_clear(num, bit) : bit_set(num, bit);
}

function bitExtract(num, count, position) {
  return (((1 << count) - 1) & (num >> position));
}

// The checksum is calculated on all bytes between the STX and the ETX (excluding the STX and the ETX)
function calculateChecksum(bufer) {
  return [...bufer].reduce((accum, value) => accum ^ value, 0);
}

function readField16(bufer, field) {
  return parseInt(bufer.slice(field * 4, field * 4 + 4).reduce((accum, val) => accum + (val & 0x0F).toString(16), ''), 16)
}

function readField32(bufer, field) {
  return parseInt(bufer.slice(field * 8, field * 8 + 8).reduce((accum, val) => accum + (val & 0x0F).toString(32), ''), 16)
}

function parse(bufer, currentCommand) {
  const STX = bufer[0];
  const LENGTH = bufer[1];
  const MSG_TYPE = bufer[2];
  const DATA = bufer.slice(3, LENGTH - 2);
  const ETX = bufer[9];
  const CHEHCKSUM = bufer[10];
  const MESSAGE_TYPE = (MSG_TYPE & 0xF0) >> 4;
  const ACK_NUMBER = (MSG_TYPE & 0xF0) & 0x0F;

  let result = {
    success: true,
    command: currentCommand,
    info: {}
  }

  const command = commands[currentCommand]

  if (LENGTH !== command.responseLength) {
    result.success = false;
    result.info.error = 'Invalid response length';
    return result;
  }

  if (MESSAGE_TYPE === 2) {
    const resultStates = states.filter(({ byte, bit }) => bitTest(DATA[byte], bit))

    // result.info = resultStates.map(({ name, description, denomination, type }) => {
    //   const res = { name, description, type }
    //   if (denomination) {
    //     console.log('VALUE', DATA[2])
    //     res.value = bitExtract(DATA[2], 3, 3);
    //   }

    //   return res
    // })

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
      billValue: '',//bitExtract(DATA[2], 3, 3),

      noPushMode: bitTest(DATA[3], 0),
      flashDownload: bitTest(DATA[3], 1),
      prestack: bitTest(DATA[3], 2),

      model: models[DATA[4]] || DATA[4],
      revision: DATA[5],
    }

    console.log('DATA', DATA)

    // console.log('models', models)


  }

  if (MESSAGE_TYPE === 6) {
    if (currentCommand === 'SOFTWARE_CRC') {
      result.info.value = DATA.slice(0, 4).reduce((accum, val) => accum + (val & 0x0F).toString(16), '0x');
    } else if (currentCommand === 'CLEAR_CASH_VALUE_IN_CASSETTE') {
      result.info.value = parseInt(DATA.reduce((accum, val) => accum + (val & 0x0F).toString(24), ''), 16);
    } else if (['ACCEPTOR_SERIAL_NUMBER', 'ACCEPTOR_BOOT_SOFTWARE_VERSION', 'ACCEPTOR_APPLICATION_SOFTWARE_VERSION', 'ACCEPTOR_VARIANT_VERSION', 'ACCEPTOR_VARIANT_NAME', 'ACCEPTOR_TYPE'].includes(currentCommand)) {
      result.info.value = Buffer.from(DATA).toString().replace(/[^\x20-\x7E]/g, '');
    } else if (['CASH_VALUE_IN_CASSETTE', 'NUMBER_OF_ACCEPTOR_RESETS'].includes(currentCommand)) {
      result.info.value = DATA.reduce((accum, val) => accum + (val & 0x0F), 0);
    } else if (currentCommand === 'ACCEPTOR_AUDIT_LIFE_TIME_TOTALS') {
      result.info = {
        performanceDataMapID: readField32(DATA, 0),
        totalOperatingHours: readField32(DATA, 1),
        totalMotorStarts: readField32(DATA, 2),
        totalDocumentsReachedEscrowPosition: readField32(DATA, 3),
        totalDocumentsPassedRecognition: readField32(DATA, 4),
        totalDocumentsPassedValidation: readField32(DATA, 5),
      }
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
    } else if (currentCommand === 'ACCEPTOR_AUDIT_GENERAL_PERFORMANCE_MEASURES') {
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
      }
    }
  }

  return result
}

// STX LENGTH MSG_TYPE DATA ETX CHECK_SUM
function compose(commandName, args = {}, ACK_NUMBER = 0, enabled = false) {
  const { data, type } = commands[commandName]
  let DATA = data;

  if (type === 0x10) {
    args.denominations.forEach((set, bit) => {
      if (set) DATA[0] = bitSet(DATA[0], bit);
    });
    if (args.interruptMode) DATA[1] = bitSet(DATA[1], 0);
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
          DATA[1] = bitClear(DATA[1], 2);
          DATA[1] = bitSet(DATA[1], 3);
          break;
      }
    }

    if (args.escrowMode) DATA[1] = bitSet(DATA[1], 4);
    if (args.noPushMode) DATA[2] = bitSet(DATA[2], 0);
    if (args.enablePowerUpB) DATA[2] = bitSet(DATA[2], 2);
    if (args.enablePowerUpC) DATA[2] = bitSet(DATA[2], 3);
    if (args.extendedNoteReporting) DATA[2] = bitSet(DATA[2], 4);

    if (commandName === 'ENABLE') {
      if (args.denominations.includes(1)) {
        args.denominations.forEach((set, bit) => {
          if (set) DATA[0] = bitSet(DATA[0], bit);
        });
      } else DATA[0] = 0x7F;
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

  const STX = 0x02;
  const ETX = 0x03;
  const LENGTH = 5 + DATA.length; // STX+LENGTH+MSG_TYPE+ETX+CHECKSUM=5 + DATA
  const MSG_TYPE = (type & 0xF0) | (ACK_NUMBER & 0xF);
  const buffer = [STX, LENGTH, MSG_TYPE].concat(DATA, ETX);
  const CHECKSUM = calculateChecksum(buffer.slice(1, -1));
  buffer.push(CHECKSUM);
  return Buffer.from(buffer);
}

module.exports = { parse, calculateChecksum, compose };
