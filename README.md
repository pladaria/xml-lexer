# XML Lexer (WIP)

Simple lexer for XML documents
- Very small! (~250 LOC)
- Works in Browser, WebWorkers, ServiceWorkers, Node.js or React Native
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

const chunk1 = `<hello><greet`; // note this
const chunk2 = `ing>Hello, world!</greeting></hello>`;

lexer.on('data', (data) => console.log(data));
lexer.write(chunk1);
lexer.write(chunk2);

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

lexer.on('data', (data) => console.log(data));
lexer.write(`<"<hello>hi</hello attr="value">`);

/*
Console output (note the open-tag value):

{ type: 'open-tag', value: '<hello"' }
{ type: 'data', value: 'hi' }
{ type: 'close-tag', value: 'hello' }
*/
```

## Example: update state machine to fix document errors

```javascript
const Lexer = require('xml-lexer');
const lexer = Lexer.create();

lexer.stateMachine[Lexer.State.tagBegin][Lexer.Action.lt] = () => {};
lexer.stateMachine[Lexer.State.tagName][Lexer.Action.error] = () => {};

lexer.on('data', (data) => console.log(data));
lexer.write(`<<hello">hi</hello attr="value">`);

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
