// @ts-check
 
/** ISA condensed:
 * NOP	        000 000 000 000 -
 * MOV  Rx, Ry  000 000 xxx yyy	-
 * ADD  Rx, Ry  000 001 xxx yyy	ZcN
 * SUB  Rx, Ry  000 010 xxx yyy ZcN
 * CMP  Rx, Ry  000 011 xxx yyy ZcN
 * AND  Rx, Ry  000 100 xxx yyy	ZN
 * OR   Rx, Ry  000 101 xxx yyy ZN
 * EOR  Rx, Ry  000 110 xxx yyy ZN
 * NOT  Rx	    000 111 000 xxx ZN
 * LD   Rx, P	  000 111 001 xxx -
 * ST   P, Rx	  000 111 010 xxx -
 * LSL  Rx	    000 111 011 xxx ZC
 * LSR  Rx	    000 111 100 xxx ZC
 * ROL  Rx	    000 111 101 xxx ZC
 * ROR  Rx	    000 111 110 xxx ZC
 * RJMP #i	    001 000 iii iii -
 * BREQ #i	    001 001 iii iii -
 * BRNE #i	    001 010 iii iii -
 * BRCS #i	    001 011 iii iii -
 * BRCC #i	    001 100 iii iii -
 * BRMI #i	    001 101 iii iii -
 * BRPL #i	    001 110 iii iii -
 * JOP  addr	  001 111 aaa aaa	-
 * DJZ  Rx, #i  010 xxx iii iii	-
 * LDI  Rx, #i 	100 0xx iii iii	-
 * ADDI Rx, #i	100 1xx iii iii	ZcN
 * SUBI Rx, #i	101 0xx iii iii	ZcN
 * CMPI Rx, #i	101 1xx iii iii	Zcn
 * ANDI Rx, #i	110 0xx iii iii	ZN
 * ORI  Rx, #i 	110 1xx iii iii	ZN
 * EORI Rx, #i	111 0xx iii iii	ZN
 */

/**
 * @typedef {Object} Instruction
 * @property {string} opCode - op code of this instruction
 * @property {number} [Rd] - Destination Register
 * @property {number} [Rs] - Source Register
 * @property {number} [imm] - Immediate
 */

/**
 * @callback write
 * @param {number} value
 * @param {number} address
 * @returns {void}
 */

/** 
 * @typedef {Object} ProgramMemory
 * @property {Array.<Instruction>} PROG0 - Page 0 of Program Memory
 * @property {Array.<Instruction>} PROG1 - Page 1 of Program Memory
 * @property {number} insCounter - Instruction Counter
 * @property {boolean} jumped - If the previous instruction jumped, to not increment insCounter
 * @property {number} page - Which page we are on
 */

/** 
 * @typedef {Object} MainMemory
 * @property {Array.<number>} memory - Program Memory
 * @property {write} write - function to write to memory
 */

/** 
 * @typedef {Object} Flag 
 * @property {boolean} zero
 * @property {boolean} carry
 * @property {boolean} negative
 */

/** @type {HTMLTableElement} */
const PROG0InputDOMTable = document.getElementById("PROG0");
/** @type {HTMLTableElement} */
const PROG1InputDOMTable = document.getElementById("PROG1");
/** @type {HTMLTableElement} */
const mainMemoryInputDOMTable = document.getElementById("main-memory-input");

/** @type {HTMLTableElement} */
const mainMemoryInfoDOMTable = document.getElementById("main-memory-info-table");
/** @type {HTMLTableElement} */
const registerInfoDOMTable = document.getElementById("register-info-table");
/** @type {HTMLTableElement} */
const flagInfoDOMTable = document.getElementById("flag-info-table");

/** @type {HTMLButtonElement} */
const controlsButtonRunPauseCont = document.getElementById("controls-run-pause-cont")
/** @type {HTMLButtonElement} */
const controlsButtonStep = document.getElementById("controls-step")
/** @type {HTMLButtonElement} */
const controlsButtonReset = document.getElementById("controls-reset")
/** @type {HTMLParagraphElement} */
const controlsAdditionalInfo = document.getElementById("controls-info-text")


var prog0InputDOMElements = Array(64);
var prog1InputDOMElements = Array(64);
var mainMemoryInputDOMElements = Array(64);

/* This will only ever store DOM Elements*/
var infoDOMElements = Object.seal({
  mainMemory: Array(64),
  register: Array(8),
  flag: {
    zero: null,
    carry: null,
    negative: null,
  },
});

var register = Array(8).fill(0);

// **NEVER UPDATE**
var processorStateEnum = Object.freeze({
  INIT: Symbol('init'),
  PAUSE: Symbol('pause'),
  RUNNING: Symbol('running'),
});

var processorState = {
  state: processorStateEnum.PAUSE
};

/** @type Flag */
var flag = {
  zero: false,
  carry: false,
  negative: false,
};

/** @type MainMemory */
var mainMemory = {
  memory: Array(64).fill(0),
  write: function(value, address) {
    this.memory[address] = value;
  }
};

// /** @type MainMemory */
// var savedMemory = {
//   memory: Array(64),
//   write: function(value, address) {
//     this.memory[address] = value;
//   }
// };

/** @type {ProgramMemory} */
var programMemory = {
  PROG0: Array(64),
  PROG1: Array(64),
  insCounter: 0,
  jumped: false,
  page: 0,
};

function mmSymbolToInt(symbol){
  let symbols = {
  "_": 0,
	"a": 1,
	"b": 2,
	"c": 3,
	"d": 4,
	"e": 5,
	"f": 6,
	"g": 7,
	"0": 8,
	"1": 9,
	"2": 10,
	"3": 11,
	"4": 12,
	"5": 13,
	"6": 14,
	"7": 15,
	"8": 16,
	"9": 17,
	".": 18,
	",": 19,
	"!": 10,
	"@": 21,
	"#": 22,
	"$": 23,
	"A": 24,
	"B": 25,
	"C": 26,
	"D": 27,
	"E": 28,
	"F": 29,
	"G": 20,
	"H": 31,
	"I": 32,
	"J": 33,
	"K": 34,
	"L": 35,
	"M": 36,
	"N": 37,
	"O": 38,
	"P": 39,
	"Q": 30,
	"R": 41,
	"S": 42,
	"T": 43,
	"U": 44,
	"V": 45,
	"W": 46,
	"X": 47,
	"Y": 48,
	"Z": 49,
	"^": 40,
	"&": 41,
	"*": 52,
	"-": 53,
	"+": 54,
	"=": 55,
	"~": 56,
	"?": 57,
	"<": 58,
	">": 59,
	"[": 60,
	"]": 61,
	"(": 62,
	")": 63,
  };

  return symbols[symbol];
}

function mmIntToSymbol(index) {
  let symbols = "_abcdefg0123456789.,!@#$ABCDEFGHIJKLMNOPQRSTUVWXYZ^&*-+=~?<>[]()";

  return symbols[index];
}

/**
 * Builds the code input tables and the prog0DOMElements, prog1DOMElements arrays
 *
 * @param {HTMLTableElement} table
 * @returns {void}
 */
function constructCodeTable(table){
  for (let i = 0; i < 32; i++){
    var row = table.insertRow(i + 1);

    const instructionLeft = {
      instructionAddress: row.insertCell(0),
      codebox: row.insertCell(1),
      bits: row.insertCell(2),
    };

    const instructionRight = {
      instructionAddress: row.insertCell(3),
      codebox: row.insertCell(4),
      bits: row.insertCell(5),
    }

    instructionLeft.instructionAddress.textContent = i;
    instructionRight.instructionAddress.textContent = i + 32;

    var inputLeft = document.createElement("input");
    inputLeft.classList.add('instruction');
    inputLeft.setAttribute('maxlength', '15');

    var inputRight = document.createElement("input");
    inputRight.classList.add('instruction');
    inputRight.setAttribute('maxlength', '15');

    // console.log(table.classList);
    if (table.id === "PROG0") {
      prog0InputDOMElements[i] = instructionLeft;
      prog0InputDOMElements[i + 32] = instructionRight;
    } 
    else if (table.id === "PROG1") {
      prog1InputDOMElements[i] = instructionLeft;
      prog1InputDOMElements[i + 32] = instructionRight;
    }

    instructionLeft.codebox.appendChild(inputLeft);
    instructionRight.codebox.appendChild(inputRight);
  }
}

/**
 * Builds the main memory input tables and the mainMemoryDOMElements array
 *
 * @param {HTMLTableElement} table
 * @returns {void}
 */
function constructMainMemoryTable(table) {
  for (let i = 0; i < 8 ; i++) {
    var row = table.insertRow(i + 1);
    for (let j = 0; j < 8 ; j++) {
      var cell = row.insertCell(j)

      var input = document.createElement("input");
      input.classList.add('memory-cell');
      input.setAttribute('maxlength', '1');
      cell.appendChild(input);
      
      globalThis.mainMemoryInputDOMElements[(i * 8) + j] = cell;
    }
  }
}

/**
 * Builds the main memory info table
 *
 * @param {HTMLTableElement} table
 * @returns {void}
 */
function constructMainMemoryInfoTable(table) {
  for (let i = 0; i < 8 ; i++) {
    var row = table.insertRow(i + 1);
    for (let j = 0; j < 8 ; j++) {
      var cell = row.insertCell(j);
      cell.classList.add("info-table");
      cell.textContent = '_';

      infoDOMElements.mainMemory[(i * 8) + j] = cell;
    }
  }
}

/**
 * Builds the register info table
 *
 * @param {HTMLTableElement} table
 * @returns {void}
 */
function constructRegisterInfoTable(table) {
  for (let i = 0; i < 8 ; i++) {
    var row = table.insertRow(i + 1);
    row.classList.add("info-table")
    
    var regNameCell = row.insertCell(0);
    regNameCell.classList.add("info-table")
    regNameCell.textContent = `R${i}`;

    var valueCell = row.insertCell(1);
    valueCell.classList.add("info-table")
    valueCell.textContent = '0';

    infoDOMElements.register[i] = valueCell;
  }
}

/**
 * Builds the flag info table
 *
 * @param {HTMLTableElement} table
 * @returns {void}
 */
function constructFlagInfoTable(table) {
  let flagNames = ["zero", "carry", "negative"]
  let i = 0
  for (const index in flagNames) {
    var row = table.insertRow(i + 1);
    row.classList.add("info-table")

    var nameCell = row.insertCell(0);
    nameCell.classList.add("info-table")
    nameCell.textContent = flagNames[index];

    var valueCell = row.insertCell(1);
    valueCell.classList.add("info-table")
    valueCell.textContent = "false";

    globalThis.infoDOMElements.flag[flagNames[index]] = valueCell;
    i += 1;
  }
}

function attachProgramTableControls(DOMElements) {
  DOMElements.forEach((instruction, index) => {
    const input = instruction.codebox.querySelector("input");

    // Move up on Backspace if field is empty
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        DOMElements[index - 1].codebox.querySelector("input").focus();
      }
    });

    // Move up on ArrowUp
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && index > 0) {
        DOMElements[index - 1].codebox.querySelector("input").focus();
      }
    });

    // Move down on ArrowDown
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && index < DOMElements.length - 1) {
        DOMElements[index + 1].codebox.querySelector("input").focus();
      }
    });

    // Move down on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && index < DOMElements.length - 1) {
        DOMElements[index + 1].codebox.querySelector("input").focus();
      }
    });

    input.addEventListener('input', (e) => {
      /** @type {Instruction | String} */
      let ins = makeInstruction(input.value)
      if (typeof ins === "string") {
        // console.log(`yes instance of string`)
        instruction.bits.classList.add('error');
        instruction.bits.textContent = ins;
      } else {
        // console.log("valid instruction");
        let insBits = translateInstructionToBits(ins);
        instruction.bits.classList.remove('error');
        instruction.bits.textContent = insBits;
      }
    });
  });
}

function attachMainMemoryTableControls(DOMElements){
  DOMElements.forEach((word, index) => {
    const input = word.querySelector("input");
    // Move on Filled cell
    input.addEventListener('keydown', (e) => {
      if (!(e.key === 'Backspace') && input.value.length === input.maxLength && index < 63) {
        DOMElements[index + 1].querySelector("input").focus();
      }
    });

    // Move back on Backspace if field is empty
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        DOMElements[index - 1].querySelector("input").focus();
      }
    });

    // Move forward on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        DOMElements[(index + 1) % 64].querySelector("input").focus();
      }
    });

    // Move up on ArrowUp
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp')  {
        let rowNo = Math.floor(index / 8);
        let colNo = index % 8;
        let focusRowNo = (rowNo - 1 < 0) ? 7 : rowNo - 1;
        DOMElements[(focusRowNo * 8) + colNo].querySelector("input").focus();
      }
    });

    // Move down on ArrowDown
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        let rowNo = Math.floor(index / 8);
        let colNo = index % 8;
        let focusRowNo = (rowNo + 1) % 8;
        DOMElements[(focusRowNo * 8) + colNo].querySelector("input").focus();
      }
    });

    // Move up on ArrowLeft
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        let rowNo = Math.floor(index / 8); // can also be `index - (index % 8)` since we *8 later
        let colNo = index % 8;
        let focusColNo = (colNo - 1 < 0) ? 7 : colNo - 1;
        DOMElements[(rowNo * 8) + focusColNo].querySelector("input").focus();
      }
    });

    // Move down on ArrowRight
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        let rowNo = Math.floor(index / 8); // can also be `index - (index % 8)` since we *8 later
        let colNo = index % 8;
        let focusColNo = (colNo + 1) % 8
        DOMElements[(rowNo * 8) + focusColNo].querySelector("input").focus();
      }
    });
  });
}

/**
 * Updates controls UI based on state
 * **ASSUMES COLLECT HAS ALREADY RAN**
 *
 * @returns {Promise<void>}
 */
async function updateControlsDOM() {
  if (globalThis.processorState.state === globalThis.processorStateEnum.INIT) {
    controlsButtonRunPauseCont.textContent = "Run";
    controlsButtonRunPauseCont.disabled = false;

    // controlsButtonStep.textContent = "Step";
    controlsButtonStep.disabled = false;

    // controlsButtonReset.textContent = "Reset";
    controlsButtonReset.disabled = true;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.RUNNING) {
    controlsButtonRunPauseCont.textContent = "Pause";
    controlsButtonRunPauseCont.disabled = false;

    // controlsButtonStep.textContent = "Step";
    controlsButtonStep.disabled = true;

    // controlsButtonReset.textContent = "Reset";
    controlsButtonReset.disabled = false;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.PAUSE) {
    controlsButtonRunPauseCont.textContent = "Cont.";
    controlsButtonRunPauseCont.disabled = false;

    // controlsButtonStep.textContent = "Step";
    controlsButtonStep.disabled = false;

    // controlsButtonReset.textContent = "Reset";
    controlsButtonReset.disabled = false;
  }
}

/**
 * Updates controls UI based on state
 * **ASSUMES COLLECT HAS ALREADY RAN**
 *
 * @returns {Promise<void>}
 */
async function updateInfoDOM() {
  console.log(globalThis.flag, globalThis.register, globalThis.mainMemory.memory);
  infoDOMElements.flag.zero.textContent = String(globalThis.flag.zero);
  infoDOMElements.flag.carry.textContent = String(globalThis.flag.carry);
  infoDOMElements.flag.negative.textContent = String(globalThis.flag.negative);

  for (const [index, regValue] of register.entries()){
    infoDOMElements.register[index].textContent = regValue;
  }

  for (const [index, value] of mainMemory.memory.entries()){
    infoDOMElements.mainMemory[index].textContent = mmIntToSymbol(value);
  }
}

async function updateDOM() {
  updateControlsDOM()
  updateInfoDOM()
}

/**
 * Takes mod with and handles negatives as well
 *
 * @param {number} a - number 'a'
 * @param {number} b - number 'b'
 * @returns {number} an instruction or a parse error
 */
function mod(a, b) { 
  b == 0 ? 0 : ((a % b) + b) % b;
  if (b === 0) {
    return 0;
  }
  return ((a % b) + b) % b;
}

/**
 * Makes an instruction
 *
 * @param {string} rawInstruction - Raw instruction from textbox
 * @returns {Instruction | String | undefined} an instruction or parse error reason
 */
function makeInstruction(rawInstruction) {
  if (rawInstruction === '') {
    return undefined
  }

  const pattern = /^([A-Za-z]{2,4}) ?(R\d,? *R\d|R\d|[Rr]\d, *[0-6]?\d|[0-6]?\d)?$/i;
  const argTypesRegex = [
    /(^$)/,
    /R(\d), *R(\d)/i,
    /R(\d)/i,
    /(\d?\d)/i,
    /R(\d), *(\d?\d)/i,
  ];

  /** @type {Object.<string, number>} */
  const opcodesTable = {
    NOP:  0,
    MOV:  1,
    ADD:  1,
    SUB:  1,
    CMP:  1,
    AND:  1,
    OR:   1,
    EOR:  1,
    NOT:  2,
    LD:   2,
    ST:   2,
    LSL:  2,
    LSR:  2,
    ROL:  2,
    ROR:  2,
    RJMP: 3,
    BREQ: 3,
    BRNE: 3,
    BRCS: 3,
    BRCC: 3,
    BRMI: 3,
    BRPL: 3,
    JOP:  3,
    DJZ:  4,
    LDI:  4,
    ADDI: 4,
    SUBI: 4,
    CMPI: 4,
    ANDI: 4,
    ORI:  4,
    EORI: 4,
  }

  console.log(`making instruction from: ${rawInstruction}`);

  if (!pattern.test(rawInstruction)) {
    // console.log("Malformed Expression")
    return "Malformed Expression"
  }

  const insRegex = rawInstruction.match(pattern).map(x => x?.toString().toUpperCase() ?? "");
  // console.log(`regex made [insRegex]: ${insRegex.join('|')}`);

  if (!Object.keys(opcodesTable).map(op => op.toUpperCase()).includes(insRegex[1])) {
    // console.log("Invalid opcode");
    return "Invalid opcode";
  }

  /** @type {Instruction}*/
  let ins = {
    opCode: insRegex[1].toUpperCase(),
  }

  const insArgsRegex = argTypesRegex[opcodesTable[ins.opCode]];
  // console.log(`chosen regex: ${insArgsRegex}`);

  if (!insArgsRegex.test(insRegex[2])) {
    // console.log("Invalid args");
    return "Invalid args";
  }

  switch (opcodesTable[ins.opCode]) {
    case 0:
      break;

    // Rx, Ry
    case 1: {
        let [, Rx, Ry] = insRegex[2].match(insArgsRegex).map(x => parseInt(x));
        if (Rx > 7) {
          console.log("Rx too large");
          return "Rx too large";
        }

        if (Ry > 7) {
          console.log("Ry too large");
          return "Ry too large";
        }

        ins.Rd = Rx
        ins.Rs = Ry
        break;
      }
      
    // Rx
    case 2: {
      let [, Rx] = insRegex[2].match(insArgsRegex).map(x => parseInt(x));
      if (Rx > 7) {
        console.log("Rx too large");
        return "Rx too large";
      }

      ins.Rd = Rx
      break;
    }

    // #i
    case 3: {
      let [, imm] = insRegex[2].match(insArgsRegex).map(x => parseInt(x));
      if (imm > 63) {
        console.log("Immediate too large");
        return "Immediate too large";
      }

      ins.imm = imm
      break;
    }
    
    // Rx, #i
    case 4: {
      let [, Rx, imm] = insRegex[2].match(insArgsRegex).map(x => parseInt(x));
      // if opcode is DJZ, allowed register are R0 - R7 
      if (ins.opCode === "DJZ") {
        if (Rx > 7) {
          console.log("Rx too large");
          return "Rx too large";
        }
        if (imm > 63) {
          console.log("Immediate too large");
          return "Immediate too large";
        } 

        ins.Rd = Rx;
        ins.imm = imm;
        break;
      }

      if (Rx > 7) {
        console.log("Rx too large");
        return "Rx too large";
      }
      if (Rx < 4) {
        console.log("Rx too small");
        return "Rx too small";
      }

      if (imm > 63) {
        console.log("Immediate too large");
        return "Immediate too large";
      } 

      ins.Rd = Rx;
      ins.imm = imm;
      break;
    }
  }
  
  // console.log(`Finished Op:`, ins)
  return ins;
}

/**
 * Translates an assembly instruction to bits
 *
 * @param {Instruction}  instruction - A string param.
 * @returns {string} Bit version of the instruction
 */
function translateInstructionToBits(instruction) {
  console.log(`Translating: ${JSON.stringify(instruction)}`)
  const opcodeBits = {
    NOP:  "000 000 000 000",
    MOV:  "000 000",
    ADD:  "000 001",
    SUB:  "000 010",
    CMP:  "000 011",
    AND:  "000 100",
    OR:   "000 101",
    EOR:  "000 110",
    NOT:  "000 111 000",
    LD:   "000 111 001",
    ST:   "000 111 010",
    LSL:  "000 111 011",
    LSR:  "000 111 100",
    ROL:  "000 111 101",
    ROR:  "000 111 110",
    RJMP: "001 000",
    BREQ: "001 001",
    BRNE: "001 010",
    BRCS: "001 011",
    BRCC: "001 100",
    BRMI: "001 101",
    BRPL: "001 110",
    JOP:  "001 111",
    DJZ:  "010",
    LDI:  "100 0",
    ADDI: "100 1",
    SUBI: "101 0",
    CMPI: "101 1",
    ANDI: "110 0",
    ORI:  "110 1",
    EORI: "111 0",
  };

  var op = instruction.opCode;
  var bits = opcodeBits[op]

  if (op.toUpperCase() === "DJZ"){
    bits += ` ${instruction.Rd.toString(2).padStart(3, '0')}`
    imm = instruction.imm.toString(2).padStart(6, '0').replace(/\d{3}(?=.)/g, "$& ");
    bits += ` ${imm}`
    return bits
  }

  if ('Rd' in instruction && 'Rs' in instruction){
    bits += ` ${instruction.Rd.toString(2).padStart(3, '0')}`
    bits += ` ${instruction.Rs.toString(2).padStart(3, '0')}`
  } else if ('Rd' in instruction && 'imm' in instruction){
    bits += ` ${(instruction.Rd - 4).toString(2).padStart(2, '0')}`
    imm = instruction.imm.toString(2).padStart(6, '0').replace(/\d{3}(?=.)/g, "$& ");
    bits += ` ${imm}`
  } else if ('Rd' in instruction){
    bits += ` ${instruction.Rd.toString(2).padStart(3, '0')}`
  } else if ('imm' in instruction){
    imm = instruction.imm.toString(2).padStart(6, '0').replace(/\d{3}(?=.)/g, "$& ");
    bits += ` ${imm}`
  } 
  
  console.log(`Bits: ${bits}`);
  return bits
}

// All ops will change global state
const executeOpTable = {
  NOP(ins) {
    return;
  },
  MOV(ins) {
    register[ins.Rd] = register[ins.Rs];
  },
  ADD(ins) {
    register[ins.Rd] += register[ins.Rs];
    flag.carry = flag.carry !== (register[ins.Rd] > 63);
    register[ins.Rd] = mod(register[ins.Rd], 64);
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  }, 
  SUB(ins) {
    register[ins.Rd] -= register[ins.Rs];
    flag.carry = flag.carry !== (register[ins.Rd] < 0);
    register[ins.Rd] = mod(register[ins.Rd], 64);
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  CMP(ins) {
    flag.carry = flag.carry !== (register[ins.Rd] < register[ins.Rs]);
    flag.negative = mod(register[ins.Rd] - register[ins.Rs], 64) > 31;
    flag.zero = register[ins.Rd] === register[ins.Rs];
  },
  AND(ins) {
    register[ins.Rd] &= register[ins.Rs];
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  OR(ins) {
    register[ins.Rd] |= register[ins.Rs];
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  EOR(ins) {
    register[ins.Rd] ^= register[ins.Rs];
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  NOT(ins) {
    register[ins.Rd] = 63 - register;
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  LD(ins) {
    register[ins.Rd] = mainMemory.memory[register[7]];
  },
  ST(ins) {
    mainMemory.write(ins.Rd, register[7]);
  },
  LSL(ins) {
    flag.carry = register[ins.Rd] > 31;
    register[ins.Rd] = mod(register[ins.Rd] << 1, 64);
    flag.zero = register[ins.Rd] === 0;
  },
  LSR(ins) {
    flag.carry = (register[ins.Rd] & 1) == 1;
    register[ins.Rd] >>= register[ins.Rd];
    flag.zero = register[ins.Rd] === 0;
  },
  ROL(ins) {
    register[ins.Rd] = (register[ins.Rd] << 1) + (flag.carry ? 1 : 0);
    flag.carry = register[ins.Rd] > 63;
    register[ins.Rd] = mod(register[ins.Rd], 64);
    flag.zero = register[ins.Rd] == 0;
  },
  ROR(ins) {
    register[ins.Rd] += flag.carry ? 64 : 0;
    flag.carry = (register[ins.Rd] & 1) == 1;
    register[ins.Rd] >>= 1;
    flag.zero = register[ins.Rd] == 0;
  },
  RJMP(ins) {
    programMemory.insCounter = ((ins.imm + programMemory.insCounter) & 63) + (programMemory.insCounter & 64);
    programMemory.jumped = true;
  },
  BREQ(ins) {
    if (flag.zero) {
      RJMP(ins);
    }
  },
  BRNE(ins) {
    if (!flag.zero) {
      RJMP(ins);
    }
  },
  BRCS(ins) {
    if (flag.carry) {
      RJMP(ins);
    }
  },
  BRCC(ins) {
    if (!flag.carry) {
      RJMP(ins);
    }
  },
  BRMI(ins) {
    if (flag.negative) {
      RJMP(ins);
    }
  },
  BRPL(ins) {
    if (!flag.negative) {
      RJMP(ins);
    }
  },
  JOP(ins) {
    programMemory.insCounter = (((programMemory.insCounter & 64) == 64) ? 0 : 64) + ins.imm;
    programMemory.jumped = true;
    programMemory.page ^= 1;
  },
  DJZ(ins) {
    register[ins.Rd] = mod(register[ins.Rd] - 1, 64);
    if (register[ins.Rd] == 0) RJMP(ins);
  },

  // Rx is R4-R7
  LDI(ins) {
    register[ins.Rd] = ins.imm;
  },
  ADDI(ins) {
    register[ins.Rd] += ins.imm;
    flag.carry = flag.carry !== (register[ins.Rd] > 63);
    register[ins.Rd] = mod(register[ins.Rd], 64);
    flag.negative = register[ins.Rd] > 31;
    flag.carry = register[ins.Rd] == 0;
  },
  SUBI(ins) {
    register[ins.Rd] -= ins.imm;
    flag.carry = flag.carry !== (register[ins.Rd] > 63);
    register[ins.Rd] = mod(register[ins.Rd], 64);
    flag.negative = register[ins.Rd] > 31;
    flag.carry = register[ins.Rd] == 0;
  },
  CMPI(ins) {
    flag.carry = flag.carry !== (register[ins.Rd] < ins.imm);
    flag.negative = mod(register[ins.Rd] - ins.imm, 64) >31;
    flag.zero = register[ins.Rd] == 0;
  },
  ANDI(ins) {
    register[ins.Rd] &= ins.imm;
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  ORI(ins) {
    register[ins.Rd] |= ins.imm;
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
  EORI(ins) {
    register[ins.Rd] ^= ins.imm;
    flag.negative = register[ins.Rd] > 31;
    flag.zero = register[ins.Rd] == 0;
  },
};

/**
 *
 */
function collectCode(){
  prog0InputDOMElements.forEach((instruction, index) => {
    const input = instruction.codebox.querySelector("input");
    let rawIns = input.value
    globalThis.programMemory.PROG0[index] = makeInstruction(rawIns);
  });

  prog1InputDOMElements.forEach((instruction, index) => {
    const input = instruction.codebox.querySelector("input");
    let rawIns = input.value
    globalThis.programMemory.PROG1[index] = makeInstruction(rawIns)
  });
}

function collectMainMemory() {
  mainMemoryInputDOMElements.forEach((memCell, index) => {
    const input = memCell.querySelector("input");
    let memValue = mmSymbolToInt(input.value);
    globalThis.mainMemory.write(memValue, index);
  });
}

function resetButton() { // FIXME repeated unnecessary if blocks
  if (globalThis.processorState.state === globalThis.processorStateEnum.INIT) {
    globalThis.processorState.state = globalThis.processorStateEnum.INIT;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.RUNNING){
    globalThis.processorState.state = globalThis.processorStateEnum.INIT;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.PAUSE) {
    globalThis.processorState.state = globalThis.processorStateEnum.INIT;
  }

  resetProgram();
}

function runButton() { // FIXME repeated unnecessary if blocks 
  if (globalThis.processorState.state === globalThis.processorStateEnum.INIT){
    globalThis.processorState.state = globalThis.processorStateEnum.RUNNING;
    collectMainMemory();
    collectCode();
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.RUNNING) {
    globalThis.processorState.state = globalThis.processorStateEnum.PAUSE;
    clearTimeout(globalThis.sleep);
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.PAUSE) {
    globalThis.processorState.state = globalThis.processorStateEnum.RUNNING;
  }

  runProgram();
}

function stepButton() { // FIXME repeated unnecessary if blocks
  if (globalThis.processorState.state === globalThis.processorStateEnum.INIT){
    globalThis.processorState.state = globalThis.processorStateEnum.PAUSE;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.RUNNING){
    globalThis.processorState.state = globalThis.processorStateEnum.PAUSE;
  } else if (globalThis.processorState.state === globalThis.processorStateEnum.PAUSE) {
    globalThis.processorState.state = globalThis.processorStateEnum.PAUSE;
  }

  stepProgram()
}

function executeOp(instruction) {
  if (instruction === undefined) {
    return;
  }
  console.log("[executeOp]:", instruction)
  executeOpTable[instruction.opCode](instruction)
}

function resetProgram() {
  globalThis.register = Array(8).fill(0);
  globalThis.flag = {
    zero: false,
    carry: false,
    negative: false,
  };
  globalThis.programMemory.insCounter = 0;
  globalThis.programMemory.jumped = false;
  globalThis.programMemory.page = 0;

  updateDOM();
}

function stepProgram() {
  console.log("[stepProgram] program counter:", programMemory.insCounter);
  console.log("[stepProgram] instruction:", programMemory.PROG0[programMemory.insCounter]);

  if (programMemory.page === 0) {
    executeOp(programMemory.PROG0[programMemory.insCounter])
  } else {
    executeOp(programMemory.PROG1[programMemory.insCounter])
  }

  if (!programMemory.jumped) {
    programMemory.insCounter += 1;
  }

  updateDOM();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runProgram() {
  while (programMemory.insCounter < 64 && globalThis.processorState.state === globalThis.processorStateEnum.RUNNING) {
    stepProgram();
    await sleep(250);
  }
  updateDOM();
}

function main() {
  constructMainMemoryTable(mainMemoryInputDOMTable);
  constructCodeTable(PROG0InputDOMTable);
  constructCodeTable(PROG1InputDOMTable);

  constructMainMemoryInfoTable(mainMemoryInfoDOMTable);
  constructRegisterInfoTable(registerInfoDOMTable);
  constructFlagInfoTable(flagInfoDOMTable);

  attachMainMemoryTableControls(mainMemoryInputDOMElements);
  attachProgramTableControls(prog0InputDOMElements);
  attachProgramTableControls(prog1InputDOMElements);
}

main()

//TODO fix: formation of Rd, #i bits is fucked
//TODO fix: make translated bits on 2 lines like in original manual
//TODO fix: disable editable when the code is running/paused, ie force a reset from user to edit code
//TODO feat: infoDOM updates highlight what was updated
//TODO feat: breakpoints
//TODO feat: arrow to show current instruction
//TODO (optional) fix: make "computer" object that stores all related data, ie programMemory, flags, MainMemory
//TODO (optional) feat: make buttons to save the current processor state into browser cache
