const Lexer = require('./src/lexer');
const State = Lexer.State;
const Action = Lexer.Action;

const lexer = Lexer.create();

const noop = function () {}; // do nothing

// update state machine
lexer.stateMachine[State.tagBegin][Action.doubleQuote] = noop;
lexer.stateMachine[State.tagBegin][Action.lt] = noop;

const xmlWithErrors = `<"<hello>hi</hello attr="value">`;

lexer.on('data', (data) => console.log(data));
lexer.write(xmlWithErrors);

