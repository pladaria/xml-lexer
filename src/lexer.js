'use strict';

const EventEmitter = require('eventemitter3');
const noop = () => {};

const State = {
    data: Symbol('state-data'),
    tagBegin: Symbol('state-tag-begin'),
    tagName: Symbol('state-tag-name'),
    tagEnd: Symbol('state-tag-end'),
    attributeNameStart: Symbol('state-waiting-attribute'),
    attributeName: Symbol('state-attribute-name'),
    attributeNameEnd: Symbol('state-attribute-name-end'),
    attributeValueBegin: Symbol('state-attribute-value-begin'),
    attributeValue: Symbol('state-attribute-value'),
};

const Action = {
    lt: Symbol('action-lt'),
    gt: Symbol('action-gt'),
    space: Symbol('action-space'),
    equal: Symbol('action-equal'),
    singleQuote: Symbol('action-single-quote'),
    doubleQuote: Symbol('action-double-quote'),
    slash: Symbol('action-slash'),
    char: Symbol('action-char'),
    error: Symbol('action-error'),
};

const Type = {
    text: 'text',
    openTag: 'open-tag',
    closeTag: 'close-tag',
    attributeName: 'attribute-name',
    attributeValue: 'attribute-value',
};

const charToAction = {
    ' ': Action.space,
    '\t': Action.space,
    '\n': Action.space,
    '\r': Action.space,
    '<': Action.lt,
    '>': Action.gt,
    '"': Action.doubleQuote,
    "'": Action.singleQuote,
    '=': Action.equal,
    '/': Action.slash,
};

const getAction = (char) => charToAction[char] || Action.char;

/**
 * @param  {Object} options
 * @param  {Boolean} options.debug
 * @return {Object}
 */
const create = (options) => {
    options = Object.assign({debug: false}, options);
    const lexer = new EventEmitter();
    let state = State.data;
    let data = '';
    let tagName = '';
    let attrName = '';
    let attrValue = '';
    let isClosing = '';
    let quoteStyle = 0; // 0: none; 1: single; 2: double

    const emitData = (type, value) => {
        // for now, ignore tags like: '?xml', '!DOCTYPE', '![CDATA[' or comments
        if (tagName[0] === '?' || tagName[0] === '!') {
            return;
        }
        const data = {type, value};
        if (options.debug) {
            console.log('emit:', data);
        }
        lexer.emit('data', data);
    };

    lexer.stateMachine = {
        [State.data]: {
            [Action.lt]: () => {
                const text = data.trim();
                if (text) {
                    emitData(Type.text, text);
                }
                tagName = '';
                isClosing = false;
                state = State.tagBegin;
            },
            [Action.char]: (char) => (data += char),
        },
        [State.tagBegin]: {
            [Action.space]: noop,
            [Action.char]: (char) => {
                tagName = char;
                state = State.tagName;
            },
            [Action.slash]: () => {
                tagName = '';
                isClosing = true;
            },
        },
        [State.tagName]: {
            [Action.space]: () => {
                if (tagName.length) {
                    if (isClosing) {
                        state = State.tagEnd;
                    } else {
                        state = State.attributeNameStart;
                        emitData(Type.openTag, tagName);
                    }
                }
            },
            [Action.gt]: () => {
                if (isClosing) {
                    emitData(Type.closeTag, tagName);
                } else {
                    emitData(Type.openTag, tagName);
                }
                data = '';
                state = State.data;
            },
            [Action.slash]: () => {
                state = State.tagEnd;
                emitData(Type.openTag, tagName);
            },
            [Action.char]: (char) => (tagName += char),
        },
        [State.tagEnd]: {
            [Action.gt]: () => {
                emitData(Type.closeTag, tagName);
                data = '';
                state = State.data;
            },
            [Action.char]: noop,
        },
        [State.attributeNameStart]: {
            [Action.char]: (char) => {
                attrName = char;
                state = State.attributeName;
            },
            [Action.gt]: () => {
                data = '';
                state = State.data;
            },
            [Action.space]: noop,
            [Action.slash]: () => {
                isClosing = true;
                state = State.tagEnd;
            },
        },
        [State.attributeName]: {
            [Action.equal]: () => {
                emitData(Type.attributeName, attrName);
                state = State.attributeValueBegin;
            },
            [Action.space]: () => (state = State.attributeNameEnd),
            [Action.gt]: () => {
                attrValue = '';
                emitData(Type.attributeName, attrName);
                emitData(Type.attributeValue, attrValue);
                state = State.data;
            },
            [Action.slash]: () => {
                isClosing = true;
                attrValue = '';
                emitData(Type.attributeName, attrName);
                emitData(Type.attributeValue, attrValue);
                state = State.tagEnd;
            },
            [Action.char]: (char) => (attrName += char),
        },
        [State.attributeNameEnd]: {
            [Action.space]: noop,
            [Action.equal]: () => (state = State.attributeValueBegin),
            [Action.gt]: () => {
                attrValue = '';
                emitData(Type.attributeName, attrName);
                emitData(Type.attributeValue, attrValue);
                state = State.data;
            },
            [Action.char]: (char) => {
                attrValue = '';
                emitData(Type.attributeName, attrName);
                emitData(Type.attributeValue, attrValue);
                attrName = char;
                state = State.attributeName;
            },
        },
        [State.attributeValueBegin]: {
            [Action.space]: noop,
            [Action.singleQuote]: () => {
                quoteStyle = 1;
                attrValue = '';
                state = State.attributeValue;
            },
            [Action.doubleQuote]: () => {
                quoteStyle = 2;
                attrValue = '';
                state = State.attributeValue;
            },
            [Action.gt]: () => {
                attrValue = '';
                emitData(Type.attributeValue, attrValue);
                state = State.data;
            },
            [Action.char]: (char) => {
                quoteStyle = 0;
                attrValue = char;
                state = State.attributeValue;
            },
        },
        [State.attributeValue]: {
            [Action.space]: (char) => {
                if (quoteStyle === 0) {
                    emitData(Type.attributeValue, attrValue);
                    state = State.attributeNameStart;
                } else {
                    attrValue += char;
                }
            },
            [Action.singleQuote]: (char) => {
                if (quoteStyle === 1) {
                    emitData(Type.attributeValue, attrValue);
                    state = State.attributeNameStart;
                } else {
                    attrValue += char;
                }
            },
            [Action.gt]: () => {
                emitData(Type.attributeValue, attrValue);
                state = State.data;
            },
            [Action.slash]: () => {
                emitData(Type.attributeValue, attrValue);
                isClosing = true;
                state = State.tagEnd;
            },
            [Action.doubleQuote]: (char) => {
                if (quoteStyle === 2) {
                    emitData(Type.attributeValue, attrValue);
                    state = State.attributeNameStart;
                } else {
                    attrValue += char;
                }
            },
            [Action.char]: (char) => (attrValue += char),
        },
    };

    const next = (char) => {
        options.debug && console.log(state, char);
        const actions = lexer.stateMachine[state];
        const action = actions[getAction(char)]
            || actions[Action.error]
            || actions[Action.char];
        action(char);
    };

    lexer.write = (str) => {
        const len = str.length;
        for (let i = 0; i < len; i++) {
            next(str[i]);
        }
    };

    return lexer;
};

module.exports = {
    State,
    Action,
    Type,
    create,
};
