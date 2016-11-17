'use strict';

const EventEmitter = require('eventemitter3');
const noop = () => {};

const State = {
    data: 'state-data',
    cdata: 'state-cdata',
    tagBegin: 'state-tag-begin',
    tagName: 'state-tag-name',
    tagEnd: 'state-tag-end',
    attributeNameStart: 'state-attribute-name-start',
    attributeName: 'state-attribute-name',
    attributeNameEnd: 'state-attribute-name-end',
    attributeValueBegin: 'state-attribute-value-begin',
    attributeValue: 'state-attribute-value',
};

const Action = {
    lt: 'action-lt',
    gt: 'action-gt',
    space: 'action-space',
    equal: 'action-equal',
    quote: 'action-quote',
    slash: 'action-slash',
    char: 'action-char',
    error: 'action-error',
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
    '"': Action.quote,
    "'": Action.quote,
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
    let isClosing = false;
    let openingQuote = '';

    const emit = (type, value) => {
        // for now, ignore tags like: '?xml', '!DOCTYPE' or comments
        if (tagName[0] === '?' || tagName[0] === '!') {
            return;
        }
        const event = {type, value};
        if (options.debug) {
            console.log('emit:', event);
        }
        lexer.emit('data', event);
    };

    lexer.stateMachine = {
        [State.data]: {
            [Action.lt]: () => {
                if (data.trim()) {
                    emit(Type.text, data);
                }
                tagName = '';
                isClosing = false;
                state = State.tagBegin;
            },
            [Action.char]: (char) => {
                data += char;
            },
        },
        [State.cdata]: {
            [Action.char]: (char) => {
                data += char;
                if (data.substr(-3) === ']]>') {
                    emit(Type.text, data.slice(0, -3));
                    data = '';
                    state = State.data;
                }
            },
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
                if (isClosing) {
                    state = State.tagEnd;
                } else {
                    state = State.attributeNameStart;
                    emit(Type.openTag, tagName);
                }
            },
            [Action.gt]: () => {
                if (isClosing) {
                    emit(Type.closeTag, tagName);
                } else {
                    emit(Type.openTag, tagName);
                }
                data = '';
                state = State.data;
            },
            [Action.slash]: () => {
                state = State.tagEnd;
                emit(Type.openTag, tagName);
            },
            [Action.char]: (char) => {
                tagName += char;
                if (tagName === '![CDATA[') {
                    state = State.cdata;
                    data = '';
                    tagName = '';
                }
            },
        },
        [State.tagEnd]: {
            [Action.gt]: () => {
                emit(Type.closeTag, tagName);
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
            [Action.space]: () => {
                state = State.attributeNameEnd;
            },
            [Action.equal]: () => {
                emit(Type.attributeName, attrName);
                state = State.attributeValueBegin;
            },
            [Action.gt]: () => {
                attrValue = '';
                emit(Type.attributeName, attrName);
                emit(Type.attributeValue, attrValue);
                data = '';
                state = State.data;
            },
            [Action.slash]: () => {
                isClosing = true;
                attrValue = '';
                emit(Type.attributeName, attrName);
                emit(Type.attributeValue, attrValue);
                state = State.tagEnd;
            },
            [Action.char]: (char) => {
                attrName += char;
            },
        },
        [State.attributeNameEnd]: {
            [Action.space]: noop,
            [Action.equal]: () => {
                emit(Type.attributeName, attrName);
                state = State.attributeValueBegin;
            },
            [Action.gt]: () => {
                attrValue = '';
                emit(Type.attributeName, attrName);
                emit(Type.attributeValue, attrValue);
                data = '';
                state = State.data;
            },
            [Action.char]: (char) => {
                attrValue = '';
                emit(Type.attributeName, attrName);
                emit(Type.attributeValue, attrValue);
                attrName = char;
                state = State.attributeName;
            },
        },
        [State.attributeValueBegin]: {
            [Action.space]: noop,
            [Action.quote]: (char) => {
                openingQuote = char;
                attrValue = '';
                state = State.attributeValue;
            },
            [Action.gt]: () => {
                attrValue = '';
                emit(Type.attributeValue, attrValue);
                data = '';
                state = State.data;
            },
            [Action.char]: (char) => {
                openingQuote = '';
                attrValue = char;
                state = State.attributeValue;
            },
        },
        [State.attributeValue]: {
            [Action.space]: (char) => {
                if (openingQuote) {
                    attrValue += char;
                } else {
                    emit(Type.attributeValue, attrValue);
                    state = State.attributeNameStart;
                }
            },
            [Action.quote]: (char) => {
                if (openingQuote === char) {
                    emit(Type.attributeValue, attrValue);
                    state = State.attributeNameStart;
                } else {
                    attrValue += char;
                }
            },
            [Action.gt]: (char) => {
                if (openingQuote) {
                    attrValue += char;
                } else {
                    emit(Type.attributeValue, attrValue);
                    data = '';
                    state = State.data;
                }
            },
            [Action.slash]: (char) => {
                if (openingQuote) {
                    attrValue += char;
                } else {
                    emit(Type.attributeValue, attrValue);
                    isClosing = true;
                    state = State.tagEnd;
                }
            },
            [Action.char]: (char) => {
                attrValue += char;
            },
        },
    };

    const step = (char) => {
        if (options.debug) {
            console.log(state, char);
        }
        const actions = lexer.stateMachine[state];
        const action = actions[getAction(char)] || actions[Action.error] || actions[Action.char];
        action(char);
    };

    lexer.write = (str) => {
        const len = str.length;
        for (let i = 0; i < len; i++) {
            step(str[i]);
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
