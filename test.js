const { parse } = require('./lib/utils');

// function hex2bin(hex) {
//   return (parseInt(hex, 16).toString(2)).padStart(8, '0');
// }

const testData = [
  {
    raw: [0x02, 0x0B, 0x20, 0x01, 0x10, 0x20, 0x00, 0x01, 0x0A, 0x03, 0x11],
    decoded: {
      info: "IDLING"
    }
  },
  {
    raw: [0x02, 0x0B, 0x20, 0x02, 0x10, 0x00, 0x00, 0x01, 0x0A, 0x03, 0x32],
    decoded: {
      info: "ACCEPTING(drawing in)"
    }
  },
  {
    raw: [0x02, 0x0B, 0x21, 0x04, 0x10, 0x18, 0x00, 0x01, 0x0A, 0x03, 0x2D],
    decoded: {
      info: "ESCROWED $5"
    }
  },
  // {
  //   raw: [0x02, 0x0B, 0x20, 0x04, 0x10, 0x18, 0x00, 0x01, 0x0A, 0x03, 0x2C],
  //   decoded: {
  //     info: "Host requests STACK"
  //   }
  // },
  {
    raw: [0x02, 0x0B, 0x21, 0x08, 0x10, 0x18, 0x00, 0x01, 0x0A, 0x03, 0x21],
    decoded: {
      info: "STACKING"
    }
  },
  {
    raw: [0x02, 0x0B, 0x21, 0x11, 0x10, 0x18, 0x00, 0x01, 0x0A, 0x03, 0x38],
    decoded: {
      info: "STACKED"
    }
  },
  {
    raw: [0x02, 0x0B, 0x21, 0x01, 0x00, 0x18, 0x00, 0x01, 0x0A, 0x03, 0x38],
    decoded: {
      info: "IDLING-LRC"
    }
  }]

testData.forEach(({ raw, decoded }) => {
  console.log('----------------')
  const res = parse(raw, 'POLL')
  // res.DATA_BITS = res.DATA.map(v => v.toString(2))
  // res.DATA_BITS_2 = res.DATA.map(v => hex2bin(v))
  // res.decoded = decoded
  // res.some = ProcessData0(res.DATA[0])

  // console.log(res.DATA_BITS_2[0], res.DATA_BITS[0], decoded.info)

  console.log(res)
  console.log('----------------')
})
