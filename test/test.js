'use strict';
const test = require('tape');

const Lexer = require('..');
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

test('happy case', t => {
    const lexer = Lexer.create();
    const xml = `<test>text</test>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.data, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test('happy case chunked', t => {
    const lexer = Lexer.create();
    const xml = `<test>text</test>`.split('');
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.data, value: 'text'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test('different attributes (single, double, no quotes, no value)', t => {
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

test('different attributes without spaces', t => {
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

test('self closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test/>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test('attributes are ignored after slash in self closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test/ a=0>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});

test('attributes are ignored in closing tag', t => {
    const lexer = Lexer.create();
    const xml = `<test></test a=0>`;
    const expected = [
        {type: Type.openTag, value: 'test'},
        {type: Type.closeTag, value: 'test'},
    ];
    assert(t, lexer, xml, expected);
});
