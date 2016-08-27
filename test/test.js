'use strict';
const test = require('ava');
const Lexer = require('../src/lexer.js');
const Type = Lexer.Type;

const assert = (t, lexer, xml, expected) => {
    let idx = 0;
    lexer.on('data', d => {
        t.deepEqual(d, expected[idx], JSON.stringify(d));
        if (++idx >= expected.length) t.end();
    });
    if (Array.isArray(xml)) {
        xml.forEach(chunk => lexer.write(chunk));
    } else {
        lexer.write(xml);
    }
};

test.cb('happy case', t => {
    const lexer = Lexer.create();
    const xml = `<test>text</test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.text, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('happy case chunked', t => {
    const lexer = Lexer.create();
    const xml = `<test>text</test>`.split('');
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.text, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('single attribute without quotes', t => {
    const lexer = Lexer.create();
    const xml = `<test a=1></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '1'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('spaces around', t => {
    const lexer = Lexer.create();
    const xml = `<  test  foo  =  "bar baz"  >text< / test >`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'foo'},
        {type: Type.attributeValue, value: 'bar baz'},
        {type: Type.text, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('slash breaking attribute', t => {
    const lexer = Lexer.create();
    const xml = `<test foo/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'foo'},
        {type: Type.attributeValue, value: ''},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('tag closing before attribute value', t => {
    const lexer = Lexer.create();
    const xml = `<test foo ></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'foo'},
        {type: Type.attributeValue, value: ''},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('tag closing before attribute value (with equal)', t => {
    const lexer = Lexer.create();
    const xml = `<test foo=></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'foo'},
        {type: Type.attributeValue, value: ''},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('various attributes (single, double, no quotes, no value)', t => {
    const lexer = Lexer.create();
    const xml = `<test a=0 b='1' c="2" d></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '0'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: '1'},
        {type: Type.attributeName, value: 'c'},
        {type: Type.attributeValue, value: '2'},
        {type: Type.attributeName, value: 'd'},
        {type: Type.attributeValue, value: ''},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('various attributes without spaces', t => {
    const lexer = Lexer.create();
    const xml = `<test a='1'b="2"c></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '1'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: '2'},
        {type: Type.attributeName, value: 'c'},
        {type: Type.attributeValue, value: ''},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('self closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('self closing tag with slash after attribute value', t => {
    const lexer = Lexer.create();
    const xml = `<test a=1/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '1'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('slashes in attribute values', t => {
    const lexer = Lexer.create();
    const xml = `<test a='/'b="/"/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '/'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: '/'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('quotes inside quotes', t => {
    const lexer = Lexer.create();
    const xml = `<test a='"'b="'"/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '"'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: "'"},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('gt in attribute values', t => {
    const lexer = Lexer.create();
    const xml = `<test a='>'b=">"/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '>'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: '>'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('lt in attribute values', t => {
    const lexer = Lexer.create();
    const xml = `<test a='<'b="<"/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.attributeName, value: 'a'},
        {type: Type.attributeValue, value: '<'},
        {type: Type.attributeName, value: 'b'},
        {type: Type.attributeValue, value: '<'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('attributes are ignored after slash in self closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test/ a=0>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('attributes are ignored in closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test></test a=0>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('ignore tags starting with ?', t => {
    const lexer = Lexer.create();
    const xml = `<?xml foo=bar><test/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('ignore comments', t => {
    const lexer = Lexer.create();
    const xml = `<test><!-- comment --></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('read CDATA', t => {
    const lexer = Lexer.create();
    const xml = `<test><![CDATA[foo<bar>&bsp;baz]]><![CDATA[]><![CDATA[foo]]]]></test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.text, value: 'foo<bar>&bsp;baz'},
        {type: Type.text, value: ']><![CDATA[foo]]'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('ignore DOCTYPE', t => {
    const lexer = Lexer.create();
    const xml = `<!DOCTYPE foo><test/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test.cb('debug mode prints stuff', t => {
    const lexer = Lexer.create({debug: true});
    const xml = `<test>text</test>`;
    const logs = [];
    const savedConsoleLog = console.log;
    console.log = (...args) => logs.push(args);
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.text, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
    console.log = savedConsoleLog;
    const expectedLogs = [
        ['state-data', '<'],
        ['state-tag-begin', 't'],
        ['state-tag-name', 'e'],
        ['state-tag-name', 's'],
        ['state-tag-name', 't'],
        ['state-tag-name', '>'],
        ['emit:', {type: 'open-tag', value: 'test'}],
        ['state-data', 't'],
        ['state-data', 'e'],
        ['state-data', 'x'],
        ['state-data', 't'],
        ['state-data', '<'],
        ['emit:', {type: 'text', value: 'text'}],
        ['state-tag-begin', '/'],
        ['state-tag-begin', 't'],
        ['state-tag-name', 'e'],
        ['state-tag-name', 's'],
        ['state-tag-name', 't'],
        ['state-tag-name', '>'],
        ['emit:', {type: 'close-tag', value: 'test'}],
    ];
    t.deepEqual(logs, expectedLogs);
});
