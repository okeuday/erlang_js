//-*-Mode:javascript;coding:utf-8;tab-width:4;c-basic-offset:4;indent-tabs-mode:()-*-
// ex: set ft=javascript fenc=utf-8 sts=4 ts=4 sw=4 et:
//
// BSD LICENSE
// 
// Copyright (c) 2014, Michael Truog <mjtruog at gmail dot com>
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in
//       the documentation and/or other materials provided with the
//       distribution.
//     * All advertising materials mentioning features or use of this
//       software must display the following acknowledgment:
//         This product includes software developed by Michael Truog
//     * The name of the author may not be used to endorse or promote
//       products derived from this software without specific prior
//       written permission
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
// CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
// OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
// DAMAGE.
//

exports.Erlang = new function() {
var Erlang = this; // namespace

var zlib = require('zlib');

// tag values here http://www.erlang.org/doc/apps/erts/erl_ext_dist.html
var TAG_VERSION = 131;
var TAG_COMPRESSED_ZLIB = 80;
var TAG_NEW_FLOAT_EXT = 70;
var TAG_BIT_BINARY_EXT = 77;
var TAG_ATOM_CACHE_REF = 78;
var TAG_SMALL_INTEGER_EXT = 97;
var TAG_INTEGER_EXT = 98;
var TAG_FLOAT_EXT = 99;
var TAG_ATOM_EXT = 100;
var TAG_REFERENCE_EXT = 101;
var TAG_PORT_EXT = 102;
var TAG_PID_EXT = 103;
var TAG_SMALL_TUPLE_EXT = 104;
var TAG_LARGE_TUPLE_EXT = 105;
var TAG_NIL_EXT = 106;
var TAG_STRING_EXT = 107;
var TAG_LIST_EXT = 108;
var TAG_BINARY_EXT = 109;
var TAG_SMALL_BIG_EXT = 110;
var TAG_LARGE_BIG_EXT = 111;
var TAG_NEW_FUN_EXT = 112;
var TAG_EXPORT_EXT = 113;
var TAG_NEW_REFERENCE_EXT = 114;
var TAG_SMALL_ATOM_EXT = 115;
var TAG_MAP_EXT = 116;
var TAG_FUN_EXT = 117;
var TAG_ATOM_UTF8_EXT = 118;
var TAG_SMALL_ATOM_UTF8_EXT = 119;

var toNativeString = {}.toString;
var packUint16 = function(value) { // big endian
    return String.fromCharCode((value >>> 8) & 0xFF) +
           String.fromCharCode(value & 0xFF);
};
var packUint32 = function(value) { // big endian
    return String.fromCharCode((value >>> 24) & 0xFF) +
           String.fromCharCode((value >>> 16) & 0xFF) +
           String.fromCharCode((value >>> 8) & 0xFF) +
           String.fromCharCode(value & 0xFF);
};
var unpackUint16 = function(i, data) { // big endian
    return (data.charCodeAt(i) << 8) |
           data.charCodeAt(i + 1);
};
var unpackUint32 = function(i, data) { // big endian
    return (data.charCodeAt(i) << 24) |
           (data.charCodeAt(i + 1) << 16) |
           (data.charCodeAt(i + 2) << 8) |
           data.charCodeAt(i + 3);
};
var ParseException = function ParseException (message) {
    var error = new Error(message);
    error.name = 'ParseException';
    this.message = error.message;
    if (error.stack) {
        this.stack = error.stack;
    }
}
ParseException.prototype = Object.create(Error.prototype, {
    name: { value: 'ParseException' }
});
var InputException = function InputException (message) {
    var error = new Error(message);
    error.name = 'InputException';
    this.message = error.message;
    if (error.stack) {
        this.stack = error.stack;
    }
}
InputException.prototype = Object.create(Error.prototype, {
    name: { value: 'InputException' }
});
var OutputException = function OutputException (message) {
    var error = new Error(message);
    error.name = 'OutputException';
    this.message = error.message;
    if (error.stack) {
        this.stack = error.stack;
    }
}
OutputException.prototype = Object.create(Error.prototype, {
    name: { value: 'OutputException' }
});
var compress = function(data, level, callback) {
    var o = zlib.createDeflate({level: level});
    var output = '';
    o.on('error', function(err) {
        o.removeAllListeners();
        callback(new OutputException(err.toString()));
    });
    o.on('data', function(chunk) {
        for (var i = 0; i < chunk.length; i++) {
            output += String.fromCharCode(chunk[i]);
        }
    });
    o.on('end', function() {
        o.removeAllListeners();
        callback(output);
    });
    o.write(data);
    o.end();
};
var uncompress = function(data, callback) {
    zlib.inflate(new Buffer(data, 'binary'), function(err, buffer) {
        if (err) {
            callback(new ParseException(err.toString()));
        }
        else {
            output = '';
            for (var i = 0; i < buffer.length; i++) {
                output += String.fromCharCode(buffer[i]);
            }
            callback(output);
        }
    });
};

Erlang.OtpErlangAtom = function OtpErlangAtom (value, utf8) {
    this.value = value;
    this.utf8 = typeof utf8 !== 'undefined' ? utf8 : false;
};
Erlang.OtpErlangAtom.prototype.binary = function() {
    if (typeof this.value == 'number') {
        return String.fromCharCode(TAG_ATOM_CACHE_REF) +
               String.fromCharCode(this.value);
    }
    else if (typeof this.value == 'string') {
        var size = this.value.length;
        if (this.utf8) {
            if (size < 256) {
                return String.fromCharCode(TAG_SMALL_ATOM_UTF8_EXT) +
                       String.fromCharCode(size) + this.value;
            }
            else {
                return String.fromCharCode(TAG_ATOM_UTF8_EXT) +
                       packUint16(size) + this.value;
            }
        }
        else {
            if (size < 256) {
                return String.fromCharCode(TAG_SMALL_ATOM_EXT) +
                       String.fromCharCode(size) + this.value;
            }
            else {
                return String.fromCharCode(TAG_ATOM_EXT) +
                       packUint16(size) + this.value;
            }
        }
    }
    else {
        throw new OutputException('unknown atom type');
    }
};
Erlang.OtpErlangAtom.prototype.toString = function() {
    return 'OtpErlangAtom(' + this.value + ',' + this.utf8 + ')';
};

Erlang.OtpErlangList = function OtpErlangList (value, improper) {
    this.value = value;
    this.improper = typeof improper !== 'undefined' ? improper : false;
};
Erlang.OtpErlangList.prototype.binary = function() {
    if (typeof this.value == 'object' &&
        toNativeString.call(this.value) == '[object Array]') {
        var length = this.value.length;
        var elements = '';
        for (var i = 0; i < length; i++) {
            elements += Erlang._term_to_binary(this.value[i]);
        } 
        if (length == 0) {
            return String.fromCharCode(TAG_NIL_EXT);
        }
        else if (this.improper) {
            return String.fromCharCode(TAG_LIST_EXT) +
                   packUint32(length - 1) + elements;
        }
        else {
            return String.fromCharCode(TAG_LIST_EXT) +
                   packUint32(length) + elements +
                   String.fromCharCode(TAG_NIL_EXT);
        }
    }
    else {
        throw new OutputException('unknown list type');
    }
};

Erlang.OtpErlangList.prototype.toString = function() {
    return 'OtpErlangList([' + this.value.join(',') + '],' +
                          this.improper + ')';
};

Erlang.OtpErlangBinary = function OtpErlangBinary (value, bits) {
    this.value = value;
    this.bits = typeof bits !== 'undefined' ? bits : 8;
};
Erlang.OtpErlangBinary.prototype.binary = function() {
    if (typeof this.value == 'string') {
        var size = this.value.length;
        if (this.bits != 8) {
            return String.fromCharCode(TAG_BIT_BINARY_EXT) +
                   packUint32(size) +
                   String.fromCharCode(this.bits) + this.value;
        }
        else {
            return String.fromCharCode(TAG_BINARY_EXT) +
                   packUint32(size) +
                   this.value;
        }
    }
    else {
        throw new OutputException('unknown binary type');
    }
};
Erlang.OtpErlangBinary.prototype.toString = function() {
    return 'OtpErlangBinary(' + this.value + ',' + this.bits + ')';
};

Erlang.OtpErlangFunction = function OtpErlangFunction (tag, value) {
    this.tag = tag;
    this.value = value;
};
Erlang.OtpErlangFunction.prototype.binary = function() {
    return String.fromCharCode(this.tag) + this.value;
};
Erlang.OtpErlangFunction.prototype.toString = function() {
    return 'OtpErlangFunction(' + this.tag + ',' + this.value + ')';
};

Erlang.OtpErlangReference = function OtpErlangReference (node, id, creation) {
    this.node = node;
    this.id = id;
    this.creation = creation;
};
Erlang.OtpErlangReference.prototype.binary = function() {
    var size = this.id.length / 4;
    if (size > 1) {
        return String.fromCharCode(TAG_NEW_REFERENCE_EXT) + packUint16(size) +
               this.node.binary() + this.creation + this.id;
    }
    else {
        return String.fromCharCode(TAG_REFERENCE_EXT) + packUint16(size) +
               this.node.binary() + this.id + this.creation;
    }
};
Erlang.OtpErlangReference.prototype.toString = function() {
    return 'OtpErlangReference(' + this.node + ',' + this.id + ',' +
                                   this.creation + ')';
};

Erlang.OtpErlangPort = function OtpErlangPort (node, id, creation) {
    this.node = node;
    this.id = id;
    this.creation = creation;
};
Erlang.OtpErlangPort.prototype.binary = function() {
    return String.fromCharCode(TAG_PORT_EXT) +
           this.node.binary() + this.id + this.creation;
};
Erlang.OtpErlangPort.prototype.toString = function() {
    return 'OtpErlangPort(' + this.node + ',' + this.id + ',' +
                                   this.creation + ')';
};

Erlang.OtpErlangPid = function OtpErlangPid (node, id, serial, creation) {
    this.node = node;
    this.id = id;
    this.serial = serial;
    this.creation = creation;
};
Erlang.OtpErlangPid.prototype.binary = function() {
    return String.fromCharCode(TAG_PID_EXT) +
           this.node.binary() + this.id + this.serial + this.creation;
};
Erlang.OtpErlangPid.prototype.toString = function() {
    return 'OtpErlangPid(' + this.node + ',' + this.id + ',' +
                             this.serial + ',' + this.creation + ')';
};

Erlang.OtpErlangMap = function OtpErlangMap (value) {
    this.value = value;
};
Erlang.OtpErlangMap.prototype.binary = function() {
    if (toNativeString.call(this.value) == '[object Object]') {
        return Erlang._object_to_binary(this.value);
    }
    else {
        throw new OutputException('unknown map type');
    }
};
Erlang.OtpErlangMap.prototype.toString = function() {
    return 'OtpErlangMap()';
};

Erlang.binary_to_term = function binary_to_term (data, callback) {
    if (typeof data != 'string') {
        callback(new ParseException('not bytes input'),
                 undefined);
        return;
    }
    var size = data.length;
    if (size <= 1) {
        callback(new ParseException('null input'),
                 undefined);
        return;
    }
    if (data.charCodeAt(0) != TAG_VERSION) {
        callback(new ParseException('invalid version'),
                 undefined);
        return;
    }
    try {
        if (TAG_COMPRESSED_ZLIB == data.charCodeAt(1)) {
            if (size <= 6) {
                callback(new ParseException('null compressed input'),
                         undefined);
                return;
            }
            var i = 2;
            var size_uncompressed = unpackUint32(i, data);
            if (size_uncompressed == 0) {
                callback(new ParseException('compressed data null'),
                         undefined);
                return;
            }
            i += 4;
            var data_compressed = data.substr(i);
            var j = data_compressed.length;
            uncompress(data_compressed, function(data_uncompressed) {
                if (typeof data_uncompressed != 'string') {
                    callback(data_uncompressed, undefined);
                }
                else {
                    if (size_uncompressed != data_uncompressed.length) {
                        callback(new ParseException('compression corrupt'),
                                 undefined);
                        return;
                    }
                    var result = Erlang._binary_to_term(0, data_uncompressed);
                    if (result[0] != size_uncompressed) {
                        callback(new ParseException('unparsed data'),
                                 undefined);
                        return;
                    }
                    callback(undefined, result[1]);
                }
            });
        }
        else {
            var result = Erlang._binary_to_term(1, data);
            if (result[0] != size) {
                callback(new ParseException('unparsed data'),
                         undefined);
                return;
            }
            callback(undefined, result[1]);
        }
    }
    catch (e) {
        var e_new = new ParseException('missing data');
        if (e.stack) {
            e_new.stack = e.stack;
        }
        callback(e_new, undefined);
    }
};

Erlang.term_to_binary = function term_to_binary (term, callback, compressed) {
    compressed = typeof compressed !== 'undefined' ? compressed : false;
    try {
        var data_uncompressed = Erlang._term_to_binary(term);
        if (compressed === false) {
            callback(undefined,
                     String.fromCharCode(TAG_VERSION) + data_uncompressed);
        }
        else {
            if (compressed === true) {
                compressed = 6;
            }
            else if (compressed < 0 || compressed > 9) {
                callback(new InputException('compressed in [0..9]'),
                         undefined);
                return;
            }
            else if (compressed === 0) {
                callback(new InputException('node.js zlib compressed 0 broken'),
                         undefined);
                return;
            }
            compress(data_uncompressed, compressed, function (data_compressed) {
                if (typeof data_compressed != 'string') {
                    callback(data_compressed, undefined);
                }
                else {
                    callback(undefined,
                             String.fromCharCode(TAG_VERSION) +
                             String.fromCharCode(TAG_COMPRESSED_ZLIB) +
                             packUint32(data_uncompressed.length) +
                             data_compressed);
                }
            });
        }
    }
    catch (e) {
        if (! (e instanceof OutputException)) {
            var e_new = new OutputException(e.toString());
            if (e.stack) {
                e_new.stack = e.stack;
            }
            e = e_new;
        }
        callback(e, undefined);
    }
};

Erlang._binary_to_term = function _binary_to_term (i, data) {
    var tag = data.charCodeAt(i);
    i += 1;
    switch (tag) {
        case TAG_NEW_FLOAT_EXT:
            var buffer = new ArrayBuffer(8);
            var view = new Uint8Array(buffer);
            for (var offset = 0; offset < 8; ++offset) {
                view[offset] = data.charCodeAt(i + offset)
            }
            var value = new DataView(buffer);
            return [i + 8, value.getFloat64(0)];
        case TAG_BIT_BINARY_EXT:
            var j = unpackUint32(i, data);
            i += 4;
            var bits = data.charCodeAt(i);
            i += 1;
            return [i + j,
                    new Erlang.OtpErlangBinary(data.substr(i, i + j), bits)];
        case TAG_ATOM_CACHE_REF:
            return [i + 1, new Erlang.OtpErlangAtom(data.charCodeAt(i))];
        case TAG_SMALL_INTEGER_EXT:
            return [i + 1, data.charCodeAt(i)];
        case TAG_INTEGER_EXT:
            var value = unpackUint32(i, data);
            if (0 != (value & 0x80000000)) {
                value = -2147483648 + (value & 0x7fffffff);
            }
            return [i + 4, value];
        case TAG_FLOAT_EXT:
            return [i + 31, parseFloat(data.substr(i, i + 31))];
        case TAG_ATOM_EXT:
            var j = unpackUint16(i, data);
            i += 2;
            return [i + j, new Erlang.OtpErlangAtom(data.substr(i, i + j))];
        case TAG_REFERENCE_EXT:
        case TAG_PORT_EXT:
            var result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var node = result[1];
            var id = data.substr(i, i + 4);
            i += 4;
            var creation = data.charAt(i);
            i += 1;
            if (tag == TAG_REFERENCE_EXT) {
                return [i, new Erlang.OtpErlangReference(node, id, creation)];
            }
            else if (tag == TAG_PORT_EXT) {
                return [i, new Erlang.OtpErlangPort(node, id, creation)];
            }
        case TAG_PID_EXT:
            var result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var node = result[1];
            var id = data.substr(i, i + 4);
            i += 4;
            var serial = data.substr(i, i + 4);
            i += 4;
            var creation = data.charAt(i);
            i += 1;
            return [i, new Erlang.OtpErlangPid(node, id, serial, creation)];
        case TAG_SMALL_TUPLE_EXT:
        case TAG_LARGE_TUPLE_EXT:
            var arity;
            if (tag == TAG_SMALL_TUPLE_EXT) {
                arity = data.charCodeAt(i);
                i += 1;
            }
            else if (tag == TAG_LARGE_TUPLE_EXT) {
                arity = unpackUint32(i, data);
                i += 4;
            }
            return Erlang._binary_to_term_sequence(i, arity, data);
        case TAG_NIL_EXT:
            return [i, new Erlang.OtpErlangList([])];
        case TAG_STRING_EXT:
            var j = unpackUint16(i, data);
            i += 2;
            return [i + j, data.substr(i, i + j)];
        case TAG_LIST_EXT:
            var arity = unpackUint32(i, data);
            i += 4;
            var result = Erlang._binary_to_term_sequence(i, arity, data);
            i = result[0];
            var tmp = result[1];
            result = Erlang._binary_to_term(i, data);
            i = result[0];
            var tail = result[1];
            if (! (tail instanceof Erlang.OtpErlangList) ||
                tail.value.length != 0) {
                tmp.push(tail);
                tmp = new Erlang.OtpErlangList(tmp, true);
            }
            else {
                tmp = new Erlang.OtpErlangList(tmp);
            }
            return [i, tmp];
        case TAG_BINARY_EXT:
            var j = unpackUint32(i, data);
            i += 4;
            return [i + j,
                    new Erlang.OtpErlangBinary(data.substr(i, i + j), 8)];
        case TAG_SMALL_BIG_EXT:
        case TAG_LARGE_BIG_EXT:
            var j;
            if (tag == TAG_SMALL_BIG_EXT) {
                j = data.charCodeAt(i);
                i += 1;
            }
            else if (tag == TAG_LARGE_BIG_EXT) {
                j = unpackUint32(i, data);
                i += 4;
            }
            var sign = data.charCodeAt(i);
            var bignum = 0;
            for (bignum_index = 0; bignum_index < j; bignum_index++) {
                var digit = data.charCodeAt(i + j - bignum_index);
                bignum = bignum * 256 + digit;
            }
            if (sign == 1) {
                bignum *= -1;
            }
            i += 1;
            return [i + j, bignum];
        case TAG_NEW_FUN_EXT:
            var size = unpackUint32(i, data);
            return [i + size,
                    new Erlang.OtpErlangFunction(tag,
                                                 data.substr(i, i + size))];
        case TAG_EXPORT_EXT:
            var old_i = i;
            var result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var module = result[1];
            result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var f = result[1];
            if (data.charCodeAt(i) != TAG_SMALL_INTEGER_EXT) {
                throw new ParseException('invalid small integer tag');
            }
            i += 1;
            var arity = data.charCodeAt(i);
            i += 1;
            return [i,
                    new Erlang.OtpErlangFunction(tag, data.substr(old_i, i))];
        case TAG_NEW_REFERENCE_EXT:
            var j = unpackUint16(i, data) * 4;
            i += 2;
            var result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var node = result[1];
            var creation = data.charAt(i);
            i += 1;
            return [i + j,
                    new Erlang.OtpErlangReference(node, data.substr(i, i + j),
                                                creation)]
        case TAG_SMALL_ATOM_EXT:
            var j = data.charCodeAt(i);
            i += 1;
            var atom_name = data.substr(i, i + j);
            var tmp;
            if (atom_name == 'true') {
                tmp = true;
            }
            else if (atom_name == 'false') {
                tmp = false;
            }
            else {
                tmp = new Erlang.OtpErlangAtom(atom_name);
            }
            return [i + j, tmp];
        case TAG_MAP_EXT:
            var arity = unpackUint32(i, data);
            i += 4;
            var pairs = {};
            for (var arity_index = 0; arity_index < arity; arity_index++) {
                var result = Erlang._binary_to_term(i, data);
                i = result[0];
                var key = result[1];
                result = Erlang._binary_to_term(i, data);
                i = result[0];
                var value = result[1];
                pairs[key] = value;
            }
            return [i, new Erlang.OtpErlangMap(pairs)];
        case TAG_FUN_EXT:
            var old_i = i;
            var numfree = unpackUint32(i, data);
            i += 4;
            var result = Erlang._binary_to_pid(i, data);
            i = result[0];
            var pid = result[1];
            var result = Erlang._binary_to_atom(i, data);
            i = result[0];
            var module = result[1];
            var result = Erlang._binary_to_integer(i, data);
            i = result[0];
            var index = result[1];
            var result = Erlang._binary_to_integer(i, data);
            i = result[0];
            var uniq = result[1];
            var result = Erlang._binary_to_term_sequence(i, numfree, data);
            i = result[0];
            var free = result[1];
            return [i,
                    new Erlang.OtpErlangFunction(tag, data.substr(old_i, i))];
        case TAG_ATOM_UTF8_EXT:
            var j = unpackUint16(i, data);
            i += 2;
            var atom_name = data.substr(i, i + j);
            return [i + j, new Erlang.OtpErlangAtom(atom_name, true)];
        case TAG_SMALL_ATOM_UTF8_EXT:
            var j = data.charCodeAt(i);
            i += 1;
            var atom_name = data.substr(i, i + j);
            return [i + j, new Erlang.OtpErlangAtom(atom_name, true)];
        case TAG_COMPRESSED_ZLIB:
            // never happens with Erlang output
            // (not handled here to avoid going to callback hell)
            throw new ParseException('nested compression unsupported');
        default:
            throw new ParseException('invalid tag');
    }
};

Erlang._binary_to_term_sequence = function _binary_to_term_sequence
                                           (i, arity, data) {
    var sequence = [];
    for (var arity_index = 0; arity_index < arity; arity_index++) {
        var result = Erlang._binary_to_term(i, data);
        i = result[0];
        sequence.push(result[1]);
    }
    return [i, sequence];
};

Erlang._binary_to_integer = function _binary_to_integer (i, data) {
    var tag = data.charCodeAt(i);
    i += 1;
    if (tag == TAG_SMALL_INTEGER_EXT) {
        return [i + 1, data.charCodeAt(i)];
    }
    else if (tag == TAG_INTEGER_EXT) {
        var value = unpackUint32(i, data);
        if (0 != (value & 0x80000000)) {
            value = -2147483648 + (value & 0x7fffffff);
        }
        return [i + 4, value];
    }
    else {
        throw new ParseException('invalid integer tag');
    }
};

Erlang._binary_to_pid = function _binary_to_pid (i, data) {
    var tag = data.charCodeAt(i);
    i += 1;
    if (tag == TAG_PID_EXT) {
        var result = Erlang._binary_to_atom(i, data);
        i = result[0];
        var node = result[1];
        var id = data.substr(i, i + 4);
        i += 4;
        var serial = data.substr(i, i + 4);
        i += 4;
        var creation = data.charAt(i);
        i += 1;
        return [i, new Erlang.OtpErlangPid(node, id, serial, creation)];
    }
    else {
        throw new ParseException('invalid pid tag');
    }
};

Erlang._binary_to_atom = function _binary_to_atom (i, data) {
    var tag = data.charCodeAt(i);
    i += 1;
    if (tag == TAG_ATOM_EXT) {
        var j = unpackUint16(i, data);
        i += 2;
        return [i + j, new Erlang.OtpErlangAtom(data.substr(i, i + j))];
    }
    else if (tag == TAG_ATOM_CACHE_REF) {
        return [i + 1, new Erlang.OtpErlangAtom(data.charCodeAt(i))];
    }
    else if (tag == TAG_SMALL_ATOM_EXT) {
        var j = data.charCodeAt(i);
        i += 1;
        return [i + j, new Erlang.OtpErlangAtom(data.substr(i, i + j))];
    }
    else if (tag == TAG_ATOM_UTF8_EXT) {
        var j = unpackUint16(i, data);
        i += 2;
        return [i + j, new Erlang.OtpErlangAtom(data.substr(i, i + j), true)];
    }
    else if (tag == TAG_SMALL_ATOM_UTF8_EXT) {
        var j = data.charCodeAt(i);
        i += 1;
        return [i + j, new Erlang.OtpErlangAtom(data.substr(i, i + j), true)];
    }
    else {
        throw new ParseException('invalid atom tag');
    }
};

Erlang._term_to_binary = function _term_to_binary (term) {
    switch (typeof term) {
        case 'string':
            return Erlang._string_to_binary(term);
        case 'number':
            if (isFinite(term) && term % 1 === 0) {
                return Erlang._integer_to_binary(term);
            }
            else {
                return Erlang._float_to_binary(term);
            }
        case 'boolean':
            if (term) {
                term = new Erlang.OtpErlangAtom('true');
            }
            else {
                term = new Erlang.OtpErlangAtom('false');
            }
            return term.binary();
        case 'object':
            switch (toNativeString.call(term)) {
                case '[object Array]':
                    return Erlang._tuple_to_binary(term);
                case '[object Object]':
                    if (term instanceof Erlang.OtpErlangAtom ||
                        term instanceof Erlang.OtpErlangList ||
                        term instanceof Erlang.OtpErlangBinary ||
                        term instanceof Erlang.OtpErlangFunction ||
                        term instanceof Erlang.OtpErlangReference ||
                        term instanceof Erlang.OtpErlangPort ||
                        term instanceof Erlang.OtpErlangPid) {
                        return term.binary();
                    }
                    else {
                        return Erlang._object_to_binary(term);
                    }
                default:
                    throw new OutputException('unknown javascript object type');
            }
        default:
            throw new OutputException('unknown javascript type');
    }
};

Erlang._string_to_binary = function _string_to_binary (term) {
    var arity = term.length;
    if (arity == 0) {
        return String.fromCharCode(TAG_NIL_EXT);
    }
    else if (arity < 65536) {
        return String.fromCharCode(TAG_STRING_EXT) + packUint16(arity) + term;
    }
    else {
        var characters = '';
        for (var i = 0; i < arity; i++) {
            characters += String.fromCharCode(TAG_SMALL_INTEGER_EXT) +
                          term.charAt(i);
        } 
        return String.fromCharCode(TAG_LIST_EXT) + packUint32(arity) +
               characters + String.fromCharCode(TAG_NIL_EXT);
    }
};

Erlang._tuple_to_binary = function _tuple_to_binary (term) {
    var arity = term.length;
    var elements = '';
    for (var i = 0; i < arity; i++) {
        elements += Erlang._term_to_binary(term[i]);
    } 
    if (arity < 256) {
        return String.fromCharCode(TAG_SMALL_TUPLE_EXT) +
               String.fromCharCode(arity) + elements;
    }
    else {
        return String.fromCharCode(TAG_LARGE_TUPLE_EXT) +
               packUint32(arity) + elements;
    }
};

Erlang._integer_to_binary = function _integer_to_binary (term) {
    if (0 <= term && term <= 255) {
        return String.fromCharCode(TAG_SMALL_INTEGER_EXT) +
               String.fromCharCode(term);
    }
    else if (-2147483648 <= term && term <= 2147483647) {
        return String.fromCharCode(TAG_INTEGER_EXT) +
               packUint32(term);
    }
    else {
        return Erlang._bignum_to_binary(term);
    }
};

Erlang._bignum_to_binary = function _bignum_to_binary (term) {
    var bignum = Math.abs(term);
    var size = Math.ceil(Erlang._bignum_bit_length(bignum) / 8.0);
    var sign;
    if (term < 0) {
        sign = String.fromCharCode(1);
    }
    else {
        sign = String.fromCharCode(0);
    }
    var L = [sign];
    for (var b = 0; b < size; b++) {
        L.push(String.fromCharCode(bignum & 255));
        bignum >>>= 8;
    }
    if (size < 256) {
        return String.fromCharCode(TAG_SMALL_BIG_EXT) +
               String.fromCharCode(size) + L.join('');
    }
    else {
        return String.fromCharCode(TAG_LARGE_BIG_EXT) +
               packUint32(size) + L.join('');
    }
};

Erlang._bignum_bit_length = function _bignum_bit_length (bignum) {
    return bignum.toString(2).length;
};

Erlang._float_to_binary = function _float_to_binary (term) {
    var buffer = new ArrayBuffer(8);
    var value = new DataView(buffer);
    value.setFloat64(0, term);
    var view = new Uint8Array(buffer);
    var result = '';
    for (var offset = 0; offset < 8; offset++) {
        result += String.fromCharCode(view[offset]);
    }
    return String.fromCharCode(TAG_NEW_FLOAT_EXT) + result;
};

Erlang._object_to_binary = function _object_to_binary (term) {
    var arity = 0;
    var pairs = '';
    for (var key in term) {
        if (term.hasOwnProperty(key)) {
            arity++;
            pairs += Erlang._term_to_binary(key) +
                     Erlang._term_to_binary(term[key]);
        }
    }
    return String.fromCharCode(TAG_MAP_EXT) +
           packUint32(arity) + pairs;
};

Erlang.ParseException = ParseException;
Erlang.InputException = InputException;
Erlang.OutputException = OutputException;

};
