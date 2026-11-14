// NOP	        000 000 000 000 -
// MOV  Rx, Ry  000 000 xxx yyy	-
// ADD  Rx, Ry  000 001 xxx yyy	ZcN
// SUB  Rx, Ry  000 010 xxx yyy ZcN
// CMP  Rx, Ry  000 011 xxx yyy ZcN
// AND  Rx, Ry  000 100 xxx yyy	ZN
// OR   Rx, Ry  000 101 xxx yyy ZN
// EOR  Rx, Ry  000 110 xxx yyy ZN
// NOT  Rx	    000 111 000 xxx ZN
// LD   Rx, P	  000 111 001 xxx -
// ST   P, Rx	  000 111 010 xxx -
// LSL  Rx	    000 111 011 xxx ZC
// LSR  Rx	    000 111 100 xxx ZC
// ROL  Rx	    000 111 101 xxx ZC
// ROR  Rx	    000 111 110 xxx ZC
// RJMP #i	    001 000 iii iii -
// BREQ #i	    001 001 iii iii -
// BRNE #i	    001 010 iii iii -
// BRCS #i	    001 011 iii iii -
// BRCC #i	    001 100 iii iii -
// BRMI #i	    001 101 iii iii -
// BRPL #i	    001 110 iii iii -
// JOP  addr	  001 111 aaa aaa	-
// DJZ  Rx, #i  010 xxx iii iii	-
// LDI  Rx, #i 	100 0xx iii iii	-
// ADDI Rx, #i	100 1xx iii iii	ZcN
// SUBI Rx, #i	101 0xx iii iii	ZcN
// CMPI Rx, #i	101 1xx iii iii	Zcn
// ANDI Rx, #i	110 0xx iii iii	ZN
// ORI  Rx, #i 	110 1xx iii iii	ZN
// EORI Rx, #i	111 0xx iii iii	ZN

const PROG0 = document.getElementById("PROG0");
const PROG1 = document.getElementById("PROG1");
var prog0Instructions = Array.of(64);
var prog1Instructions = Array.of(64);

function construct_table(table){
  for (let i = 0; i < 32; i++){
    var row = table.insertRow(i+1);

    var instructionLeft = {
      insAddr: row.insertCell(0),
      codebox: row.insertCell(1),
      bits: row.insertCell(2),
    };

    var instructionRight = {
      insAddr: row.insertCell(3),
      codebox: row.insertCell(4),
      bits: row.insertCell(5),
    }

    instructionLeft.insAddr.textContent = i;
    instructionRight.insAddr.textContent = i + 32;

    var inputLeft = document.createElement("input");
    var inputRight = document.createElement("input");
    inputLeft.classList.add('instruction');
    inputLeft.setAttribute('maxlength', '10');
    inputRight.classList.add('instruction');
    inputRight.setAttribute('maxlength', '10');
    // console.log(table.classList);
    if (table.id === "PROG0") {
      inputLeft.classList.add("PROG0-instruction");
      inputRight.classList.add("PROG0-instruction");
      prog0Instructions[i] = instructionLeft;
      prog0Instructions[i + 32] = instructionRight;
    } 
    else if (table.id === "PROG1") {
      inputLeft.classList.add("PROG1-instruction");
      inputRight.classList.add("PROG1-instruction");
      prog1Instructions[i] = instructionLeft;
      prog1Instructions[i + 32] = instructionRight;
    }

    instructionLeft.codebox.appendChild(inputLeft);
    instructionRight.codebox.appendChild(inputRight);
  }
}

construct_table(PROG0);
construct_table(PROG1);

console.log(prog0Instructions)
prog0Instructions.forEach((instruction, index) => {
  const input = instruction.codebox.querySelector("input");
  // Move backward on Backspace if field is empty
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
      prog0Instructions[index - 1].codebox.querySelector("input").focus();
    }
  });

  // Move back on ArrowUp
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && index > 0) {
      prog0Instructions[index - 1].codebox.querySelector("input").focus();
    }
  });

  // Move forward when max length is reached
  input.addEventListener('input', (e) => {
    if (input.value.length >= input.maxLength && index < prog0Instructions.length - 1) {
      prog0Instructions[index + 1].codebox.querySelector("input").focus();
    }
  });

  // Move forward on ArrowDown
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && index < prog0Instructions.length - 1) {
      prog0Instructions[index + 1].codebox.querySelector("input").focus();
    }
  });

  // Move forward on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && index < prog0Instructions.length - 1) {
      prog0Instructions[index + 1].codebox.querySelector("input").focus();
    }
  });

  input.addEventListener('input', (e) => {
    validateInstruction(input.value)
  });
});

const REGMAX = 64
const REGZERO = 31
var register = Array.of(8);
var flag = {
  zero: false,
  carry: false,
  negative: false,
};

var mainMemory = {
  memory: Array.of(64),
  write: function(value, address) {
    if (number >= 64) {
      console.log(`Illegal Write: ${number}`);
      return;
    }
    memory[address] = value;
  }
};

var programMemory = {
  PROG1: Array.of(64),
  PROG2: Array.of(64),
};

var insCounter = 0;
var jumped = false;
var page = 0;

function mod(a, b) { 
  b == 0 ? 0 : ((a % b) + b) % b;
  if (b === 0) {
    return 0;
  }
  return ((a % b) + b) % b;
}

function validateInstruction(instruction) {
  const pattern = /^([A-Za-z]{2,4}) +(R[0-7], *R[0-7]|R[0-7]|R[0-7], *[0-6]?[0-9]|[0-6]?[0-9])$/;
  const argTypesRegex = [
    /(^$)/,
    /R([0-7]), *R([0-7])/, 
    /R([0-7])/, 
    /([0-6]?[0-9])/, 
    /R([0-7]), *([0-6]?[0-9])/,
  ];

  const opcodes = {
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

  if (!pattern.test(instruction)) {
    console.log("Fucked")
    return false
  }

  instruction = instruction.match(pattern);

  if (!Object.keys(opcodes).includes(instruction[1])) {
    console.log("Invalid opcode");
    return false
  }

  let ins = {
    opcode: instruction[1],
  }

  const insArgsRegex = argTypesRegex[opcodes[ins.opcode]]
  console.log(insArgsRegex)

  if (!insArgsRegex.test(instruction[2])) {
    console.log("Invalid args");
    return false
  }

  switch (opcodes[ins.opcode]) {
    case 0:
      break;

    case 1:
      ins["Rx"] = instruction[2].match(insArgsRegex)[1]
      ins["Ry"] = instruction[2].match(insArgsRegex)[2]
      break;

    case 2:
      ins["Rx"] = instruction[2].match(insArgsRegex)[1]
      break;

    case 3:
      ins["imm6"] = instruction[2].match(insArgsRegex)[1]
      break;

    case 4:
      ins["Rx"] = instruction[2].match(insArgsRegex)[1]
      ins["imm6"] = instruction[2].match(insArgsRegex)[2]
      break;
  }
}

// All ops will change global state
const opcode = {
  NOP() {
    return;
  },
  MOV(Rd, Rs) {
    register[Rd] = register[Rs];
  },
  ADD(Rd, Rs) {
    register[Rd] += register[Rs];
    flag.carry ^= register[Rd] > 63;
    register[Rd] = mod(register[Rd], 64);
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  }, 
  SUB(Rd, Rs) {
    register[Rd] -= register[Rs];
    flag.carry ^= register[Rd] < 0;
    register[Rd] = mod(register[Rd], 64);
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  },
  CMP(Rd, Rs) {
    flag.carry ^= register[Rd] < register[Rs];
    flag.negative = mod(register[Rd] - register[Rs], 64) > 31;
    flag.zero = register[Rd] === register[Rs];
  },
  AND(Rd, Rs) {
    register[Rd] &= register[Rs];
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  },
  OR(Rd, Rs) {
    register[Rd] |= register[Rs];
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  },
  EOR(Rd, Rs) {
    register[Rd] ^= register[Rs];
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  },
  NOT(Rd) {
    register[Rd] = 63 - register;
    flag.negative = register[Rd] > 31;
    flag.zero = register[Rd] == 0;
  },
  LD(Rd, P) {
    register[Rd] = mainMemory.memory[register[7]];
  },
  ST(P, Rd) {
    mainMemory.write(Rd, register[7]);
  },
  LSL(Rd) {
    flag.carry = register[Rd] > 31;
    register[Rd] = mod(register[Rd] << 1, 64);
    flag.zero = register[Rd] === 0;
  },
  LSR(Rd) {
    flag.carry = (register[Rd] & 1) == 1;
    register[Rd] >>= register[Rd];
    flag.zero = register[Rd] === 0;
  },
  ROL(Rd) {
    registers[Rd] = (registers[Rd] << 1) + (flag.carry ? 1 : 0);
    flag.carry = registers[Rd] > 63;
    registers[Rd] = mod(registers[Rd], 64);
    flag.zero = registers[Rd] == 0;
  },
  ROR(Rd) {
    registers[Rd] += flag.carry ? 64 : 0;
    flag.carry = (registers[Rd] & 1) == 1;
    registers[Rd] >>= 1;
    flag.zero = registers[Rd] == 0;
  },
  RJMP(insAddr) {
    insCounter = ((addr + insCounter) & 63) + (insCounter & 64);
    jumped = true;
  },
  BREQ(insAddr) {
    if (flag.zero) {
      RJMP(addr);
    }
  },
  BRNE(insAddr) {
    if (!flag.zero) {
      RJMP(addr);
    }
  },
  BRCS(insAddr) {
    if (flag.carry) {
      RJMP(addr);
    }
  },
  BRCC(insAddr) {
    if (!flag.carry) {
      RJMP(addr);
    }
  },
  BRMI(insAddr) {
    if (flag.negative) {
      RJMP(addr);
    }
  },
  BRPL(insAddr) {
    if (!flag.negative) {
      RJMP(addr);
    }
  },
  JOP(addr) {
    insCounter = (((insCounter & 64) == 64) ? 0 : 64) + addr;
    jumped = true;
  },
  DJZ(Rd, insAddr) {
    registers[Rd] = mod(registers[Rd] - 1, 64);
    if (registers[Rd] == 0) RJMP(addr);
  },

  // Rx is R4-R7
  LDI(Rx, imm6) { 
    register[Rx] = imm6;
  },
  ADDI(Rx, imm6) {
    register[Rx] += imm6;
    flag.carry ^= register[Rx] > 63;
    registers[Rx] = mod(registers[Rx], 64);
    flag.negative = register[Rx] > 31;
    flag.carry = register[Rx] == 0;
  },
  SUBI(Rx, imm6) {
    register[Rx] -= imm6;
    flag.carry ^= register[Rx] > 63;
    registers[Rx] = mod(registers[Rx], 64);
    flag.negative = register[Rx] > 31;
    flag.carry = register[Rx] == 0;
  },
  CMPI(Rx, imm6) {
    flag.carry ^= register[Rx] < imm6;
    flag.negative = mod(register[Rx] - imm6, 64) >31;
    flag.zero = register[Rx] == 0;
  },
  ANDI(Rx, imm6) {
    registers[Rx] &= imm6;
    flag.negative = registers[Rx] > 31;
    flag.zero = registers[Rx] == 0;
  },
  ORI(Rx, imm6) {
    registers[Rx] |= imm6;
    flag.negative = registers[Rx] > 31;
    flag.zero = registers[Rx] == 0;
  },
  EORI(Rx, imm6) {
    registers[Rx] ^= imm6;
    flag.negative = registers[Rx] > 31;
    flag.zero = registers[Rx] == 0;
  },
};