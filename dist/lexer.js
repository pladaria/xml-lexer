'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var EventEmitter = require('eventemitter3');
var noop = function noop() {};

var State = {
    data: Symbol('state-data'),
    tagBegin: Symbol('state-tag-begin'),
    tagName: Symbol('state-tag-name'),
    tagEnd: Symbol('state-tag-end'),
    attributeNameStart: Symbol('state-waiting-attribute'),
    attributeName: Symbol('state-attribute-name'),
    attributeNameEnd: Symbol('state-attribute-name-end'),
    attributeValueBegin: Symbol('state-attribute-value-begin'),
    attributeValue: Symbol('state-attribute-value')
};

var Action = {
    lt: Symbol('action-lt'),
    gt: Symbol('action-gt'),
    space: Symbol('action-space'),
    equal: Symbol('action-equal'),
    quote: Symbol('action-quote'),
    slash: Symbol('action-slash'),
    char: Symbol('action-char'),
    error: Symbol('action-error')
};

var Type = {
    text: 'text',
    openTag: 'open-tag',
    closeTag: 'close-tag',
    attributeName: 'attribute-name',
    attributeValue: 'attribute-value'
};

var charToAction = {
    ' ': Action.space,
    '\t': Action.space,
    '\n': Action.space,
    '\r': Action.space,
    '<': Action.lt,
    '>': Action.gt,
    '"': Action.quote,
    "'": Action.quote,
    '=': Action.equal,
    '/': Action.slash
};

var getAction = function getAction(char) {
    return charToAction[char] || Action.char;
};

/**
 * @param  {Object} options
 * @param  {Boolean} options.debug
 * @return {Object}
 */
var create = function create(options) {
    var _State$data, _State$tagBegin, _State$tagName, _State$tagEnd, _State$attributeNameS, _State$attributeName, _State$attributeNameE, _State$attributeValue, _State$attributeValue2, _lexer$stateMachine;

    options = Object.assign({ debug: false }, options);
    var lexer = new EventEmitter();
    var state = State.data;
    var data = '';
    var tagName = '';
    var attrName = '';
    var attrValue = '';
    var isClosing = '';
    var openingQuote = '';

    var emitData = function emitData(type, value) {
        // for now, ignore tags like: '?xml', '!DOCTYPE', '![CDATA[' or comments
        if (tagName[0] === '?' || tagName[0] === '!') {
            return;
        }
        var data = { type: type, value: value };
        if (options.debug) {
            console.log('emit:', data);
        }
        lexer.emit('data', data);
    };

    lexer.stateMachine = (_lexer$stateMachine = {}, _defineProperty(_lexer$stateMachine, State.data, (_State$data = {}, _defineProperty(_State$data, Action.lt, function () {
        var text = data.trim();
        if (text) {
            emitData(Type.text, text);
        }
        tagName = '';
        isClosing = false;
        state = State.tagBegin;
    }), _defineProperty(_State$data, Action.char, function (char) {
        return data += char;
    }), _State$data)), _defineProperty(_lexer$stateMachine, State.tagBegin, (_State$tagBegin = {}, _defineProperty(_State$tagBegin, Action.space, noop), _defineProperty(_State$tagBegin, Action.char, function (char) {
        tagName = char;
        state = State.tagName;
    }), _defineProperty(_State$tagBegin, Action.slash, function () {
        tagName = '';
        isClosing = true;
    }), _State$tagBegin)), _defineProperty(_lexer$stateMachine, State.tagName, (_State$tagName = {}, _defineProperty(_State$tagName, Action.space, function () {
        if (tagName.length) {
            if (isClosing) {
                state = State.tagEnd;
            } else {
                state = State.attributeNameStart;
                emitData(Type.openTag, tagName);
            }
        }
    }), _defineProperty(_State$tagName, Action.gt, function () {
        if (isClosing) {
            emitData(Type.closeTag, tagName);
        } else {
            emitData(Type.openTag, tagName);
        }
        data = '';
        state = State.data;
    }), _defineProperty(_State$tagName, Action.slash, function () {
        state = State.tagEnd;
        emitData(Type.openTag, tagName);
    }), _defineProperty(_State$tagName, Action.char, function (char) {
        return tagName += char;
    }), _State$tagName)), _defineProperty(_lexer$stateMachine, State.tagEnd, (_State$tagEnd = {}, _defineProperty(_State$tagEnd, Action.gt, function () {
        emitData(Type.closeTag, tagName);
        data = '';
        state = State.data;
    }), _defineProperty(_State$tagEnd, Action.char, noop), _State$tagEnd)), _defineProperty(_lexer$stateMachine, State.attributeNameStart, (_State$attributeNameS = {}, _defineProperty(_State$attributeNameS, Action.char, function (char) {
        attrName = char;
        state = State.attributeName;
    }), _defineProperty(_State$attributeNameS, Action.gt, function () {
        data = '';
        state = State.data;
    }), _defineProperty(_State$attributeNameS, Action.space, noop), _defineProperty(_State$attributeNameS, Action.slash, function () {
        isClosing = true;
        state = State.tagEnd;
    }), _State$attributeNameS)), _defineProperty(_lexer$stateMachine, State.attributeName, (_State$attributeName = {}, _defineProperty(_State$attributeName, Action.space, function () {
        return state = State.attributeNameEnd;
    }), _defineProperty(_State$attributeName, Action.equal, function () {
        emitData(Type.attributeName, attrName);
        state = State.attributeValueBegin;
    }), _defineProperty(_State$attributeName, Action.gt, function () {
        attrValue = '';
        emitData(Type.attributeName, attrName);
        emitData(Type.attributeValue, attrValue);
        state = State.data;
    }), _defineProperty(_State$attributeName, Action.slash, function () {
        isClosing = true;
        attrValue = '';
        emitData(Type.attributeName, attrName);
        emitData(Type.attributeValue, attrValue);
        state = State.tagEnd;
    }), _defineProperty(_State$attributeName, Action.char, function (char) {
        return attrName += char;
    }), _State$attributeName)), _defineProperty(_lexer$stateMachine, State.attributeNameEnd, (_State$attributeNameE = {}, _defineProperty(_State$attributeNameE, Action.space, noop), _defineProperty(_State$attributeNameE, Action.equal, function () {
        return state = State.attributeValueBegin;
    }), _defineProperty(_State$attributeNameE, Action.gt, function () {
        attrValue = '';
        emitData(Type.attributeName, attrName);
        emitData(Type.attributeValue, attrValue);
        state = State.data;
    }), _defineProperty(_State$attributeNameE, Action.char, function (char) {
        attrValue = '';
        emitData(Type.attributeName, attrName);
        emitData(Type.attributeValue, attrValue);
        attrName = char;
        state = State.attributeName;
    }), _State$attributeNameE)), _defineProperty(_lexer$stateMachine, State.attributeValueBegin, (_State$attributeValue = {}, _defineProperty(_State$attributeValue, Action.space, noop), _defineProperty(_State$attributeValue, Action.quote, function (char) {
        openingQuote = char;
        attrValue = '';
        state = State.attributeValue;
    }), _defineProperty(_State$attributeValue, Action.gt, function () {
        attrValue = '';
        emitData(Type.attributeValue, attrValue);
        state = State.data;
    }), _defineProperty(_State$attributeValue, Action.char, function (char) {
        openingQuote = '';
        attrValue = char;
        state = State.attributeValue;
    }), _State$attributeValue)), _defineProperty(_lexer$stateMachine, State.attributeValue, (_State$attributeValue2 = {}, _defineProperty(_State$attributeValue2, Action.space, function (char) {
        if (openingQuote) {
            attrValue += char;
        } else {
            emitData(Type.attributeValue, attrValue);
            state = State.attributeNameStart;
        }
    }), _defineProperty(_State$attributeValue2, Action.quote, function (char) {
        if (openingQuote === char) {
            emitData(Type.attributeValue, attrValue);
            state = State.attributeNameStart;
        } else {
            attrValue += char;
        }
    }), _defineProperty(_State$attributeValue2, Action.gt, function (char) {
        if (openingQuote) {
            attrValue += char;
        } else {
            emitData(Type.attributeValue, attrValue);
            state = State.data;
        }
    }), _defineProperty(_State$attributeValue2, Action.slash, function (char) {
        if (openingQuote) {
            attrValue += char;
        } else {
            emitData(Type.attributeValue, attrValue);
            isClosing = true;
            state = State.tagEnd;
        }
    }), _defineProperty(_State$attributeValue2, Action.char, function (char) {
        return attrValue += char;
    }), _State$attributeValue2)), _lexer$stateMachine);

    var step = function step(char) {
        if (options.debug) {
            console.log(state, char);
        }
        var actions = lexer.stateMachine[state];
        var action = actions[getAction(char)] || actions[Action.error] || actions[Action.char];
        action(char);
    };

    lexer.write = function (str) {
        var len = str.length;
        for (var i = 0; i < len; i++) {
            step(str[i]);
        }
    };

    return lexer;
};

module.exports = {
    State: State,
    Action: Action,
    Type: Type,
    create: create
};