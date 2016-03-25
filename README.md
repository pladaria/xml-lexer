# XML Lexer (WIP)

Simple lexer for XML documents
- Very small! (~250 LOC)
- Works in Browser, Node.js or React Native
- Fast and simple
- Fault tolerant
- Easy to extend (state machine is exposed in Lexer instances)

## Install

```bash
npm install --save xml-lexer
```

## Example: happy case

```javascript
const lexer = require('xml-lexer').create();

const xml =
`<hello color="blue">
  <greeting>Hello, world!</greeting>
</hello>`;

lexer.on('data', (data) => console.log(data));
lexer.write(xml);

/*
Console output:

{ type: 'open-tag', value: 'hello' }
{ type: 'attribute-name', value: 'color' }
{ type: 'attribute-value', value: 'blue' }
{ type: 'open-tag', value: 'greeting' }
{ type: 'data', value: 'Hello, world!' }
{ type: 'close-tag', value: 'greeting' }
{ type: 'close-tag', value: 'hello' }
*/
```
## Example: chunked processing

```javascript
const lexer = require('xml-lexer').create();

const xmlChunk1 = `<hello><greet`; // note this
const xmlChunk2 = `ing>Hello, world!</greeting></hello>`;

lexer.on('data', (data) => console.log(data));
lexer.write(xmlChunk1);
lexer.write(xmlChunk2);

/*
Console output:

{ type: 'open-tag', value: 'hello' }
{ type: 'open-tag', value: 'greeting' }
{ type: 'data', value: 'Hello, world!' }
{ type: 'close-tag', value: 'greeting' }
{ type: 'close-tag', value: 'hello' }
*/
```

## Example: document with errors

```javascript
const lexer = require('xml-lexer').create();

const xmlWithErrors = `<"<hello>hi</hello attr="value">`;

lexer.on('data', (data) => console.log(data));
lexer.write(xmlWithErrors);

/*
Console output (note the fixed open-tag value):

{ type: 'open-tag', value: '<hello"' }
{ type: 'data', value: 'hi' }
{ type: 'close-tag', value: 'hello' }
*/
```

## Example: update state machine to fix document errors

```javascript
const Lexer = require('./src/lexer');
const State = Lexer.State;
const Action = Lexer.Action;

const lexer = Lexer.create();

const noop = function () {}; // do nothing

// update state machine
lexer.stateMachine[State.tagBegin][Action.lt] = noop;
lexer.stateMachine[State.tagName][Action.error] = noop;

const xmlWithErrors = `<<hello">hi</hello attr="value">`;

lexer.on('data', (data) => console.log(data));
lexer.write(xmlWithErrors);

/*
Console output (note the fixed open-tag value):

{ type: 'open-tag', value: 'hello' }
{ type: 'data', value: 'hi' }
{ type: 'close-tag', value: 'hello' }
*/
```
## To do (ordered by priority)

- Tests
- ES5 bundle with webpack
- Stream interface (allow piping)
- Improve and extract event-emitter to separate module (or reuse some other one)
- DEV/PRODUCTION modes
- Special treatment for Prolog and document type declaration
- Special treatment for XML Comments
- Special treatment for CDATA Sections
- Entities

## License

MIT
