/* eslint no-useless-escape: "off" */
const JSONStream = require('../json-stream.js');

test('parse json object', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":true}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': true
	});
});

test('parse json string in two parts', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":');
	expect(cb.mock.calls.length).toBe(0);
	stream.decode('true}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': true
	});
});

test('ignore closing brackets in strings', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":"}"}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': '}'
	});
});

test('ignore opening brackets in strings', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":"{"}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': '{'
	});
});

test('ignore escaped quotes in strings', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":"\\"}"}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': '\"}'
	});
});

test('decode many objects', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":true}{"test":false}');
	expect(cb.mock.calls.length).toBe(2);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': true
	});
	expect(cb.mock.calls[1][0]).toEqual({
		'test': false
	});
});

test('decode nested objects', () => {
	const cb = jest.fn();
	const stream = new JSONStream(cb);
	stream.decode('{"test":{"test":true}}');
	expect(cb.mock.calls.length).toBe(1);
	expect(cb.mock.calls[0][0]).toEqual({
		'test': { 'test': true }
	});
});
