const commands = {
  SOFTWARE_CRC: {
    data: [0x00, 0x00, 0x00],
    description: 'Acceptor\'s Software CRC',
    type: 0x60,
    responseLength: 0x0B,
  },
  CASH_VALUE_IN_CASSETTE: {
    data: [0x00, 0x00, 0x01],
    description: 'The total value of all the notes in the cash box.',
    type: 0x60,
    responseLength: 0x0B,
  },
  NUMBER_OF_ACCEPTOR_RESETS: {
    data: [0x00, 0x00, 0x02],
    description: 'Total number of Power up/resets the Acceptor has performed',
    type: 0x60,
    responseLength: 0x0B,
  },
  CLEAR_CASH_VALUE_IN_CASSETTE: {
    data: [0x00, 0x00, 0x03],
    description: 'Acceptor clears its note value counter to zero.',
    type: 0x60,
    responseLength: 0x0B,
  },
  ACCEPTOR_TYPE: {
    data: [0x00, 0x00, 0x04],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x19,
  },
  ACCEPTOR_SERIAL_NUMBER: {
    data: [0x00, 0x00, 0x05],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x19,
  },
  ACCEPTOR_BOOT_SOFTWARE_VERSION: {
    data: [0x00, 0x00, 0x06],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x0E,
  },
  ACCEPTOR_APPLICATION_SOFTWARE_VERSION: {
    data: [0x00, 0x00, 0x07],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x0E,
  },
  ACCEPTOR_VARIANT_NAME: {
    data: [0x00, 0x00, 0x08],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x25,
  },
  ACCEPTOR_VARIANT_VERSION: {
    data: [0x00, 0x00, 0x09],
    description: 'The Acceptor responds with a non-zero terminated ASCII string.',
    type: 0x60,
    responseLength: 0x0E,
  },
  ACCEPTOR_AUDIT_LIFE_TIME_TOTALS: {
    data: [0x00, 0x00, 0x0A],
    description: 'The Acceptor responds with an array of 32 bit integer values.',
    type: 0x60,
    responseLength: 0x35,
  },
  ACCEPTOR_AUDIT_QP_MEASURES: {
    data: [0x00, 0x00, 0x0B],
    description: 'The Acceptor responds with an array of 16 bit integer values.',
    type: 0x60,
    responseLength: 0x3D,
  },
  ACCEPTOR_AUDIT_GENERAL_PERFORMANCE_MEASURES: {
    data: [0x00, 0x00, 0x0C],
    // data: [0xDA, 0xDA, 0xDA],
    description: 'The Acceptor responds with an array of 16 bit integer values.',
    type: 0x60,
    responseLength: 0x4D,
  },
  SOFT_RESET: {
    data: [0x7F, 0x7F, 0x7F],
    description: 'Acceptor will reset and perform power up initialization.',
    type: 0x60,
  },
  SETUP: {
    data: [0x00, 0x00, 0x00],
    description: 'Configure device according to configuration',
    type: 0x10,
    responseLength: 0x0B,
  },
  POLL: {
    data: [0x00, 0x00, 0x00],
    description: '',
    type: 0x10,
    responseLength: 0x0B,
  },
  ENABLE: {
    data: [0x00, 0x00, 0x00],
    description: 'Open configured channels and satrt accepting bills',
    type: 0x10,
    responseLength: 0x0B,
  },
  DISABLE: {
    data: [0x00, 0x00, 0x00],
    description: 'Inhibit all the channels and stop accepting bills',
    type: 0x10,
    responseLength: 0x0B,
  },
  STACK: {
    data: [0x00, 0x00, 0x00],
    description: 'Stack the Bill',
    type: 0x10,
    responseLength: 0x0B,
  },
  RETURN: {
    data: [0x00, 0x00, 0x00],
    description: 'Return the Bill',
    type: 0x10,
    responseLength: 0x0B,
  },

  QUERY_EXPANDED_NOTE_SPECIFICATION: {
    data: [0x00, 0x00, 0x00],
    description: '',
    type: 0x70,
    subtype: 0x02,
  },

};

module.exports = commands
