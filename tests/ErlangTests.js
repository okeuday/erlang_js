//-*-Mode:javascript;coding:utf-8;tab-width:4;c-basic-offset:4;indent-tabs-mode:()-*-
// ex: set ft=javascript fenc=utf-8 sts=4 ts=4 sw=4 et:
//
// BSD LICENSE
// 
// Copyright (c) 2014, Michael Truog <mjtruog at gmail dot com>
// Copyright (c) 2009-2013, Dmitry Vasiliev <dima@hlabs.org>
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

var Erlang = require('./../Erlang.js').Erlang; 
var assert = require('assert');

// many of the test cases were adapted
// from erlport (https://github.com/hdima/erlport)
// to make the tests more exhaustive

var toNativeString = {}.toString;
String.prototype.repeat = function(i)
{
    return new Array(i + 1).join(this);
};

(function AtomTestCase () {
    (function test_atom () {
        var atom1 = new Erlang.OtpErlangAtom('test');
        assert.equal(toNativeString.call(atom1), '[object Object]');
        assert.deepEqual(new Erlang.OtpErlangAtom('test'), atom1);
        assert.equal('OtpErlangAtom(test,false)', '' + atom1);
        assert.ok(atom1 instanceof Erlang.OtpErlangAtom);
        var atom2 = new Erlang.OtpErlangAtom('test2');
        var atom1_new = new Erlang.OtpErlangAtom('test');
        assert.notDeepEqual(atom1, atom2);
        assert.deepEqual(atom1, atom1_new);
        assert.notStrictEqual(atom1, atom1_new);
        assert.equal('X'.repeat(255),
                     (new Erlang.OtpErlangAtom('X'.repeat(255))).value);
        assert.equal('X'.repeat(256),
                     (new Erlang.OtpErlangAtom('X'.repeat(256))).value);
    }).call(this);
    (function test_atom () {
        assert.throws(function() {
                          (new Erlang.OtpErlangAtom([1, 2])).binary();
                      }, Erlang.OutputException);
    }).call(this);
}).call(this);

(function ListTestCase () {
    (function test_list () {
        var lst = new Erlang.OtpErlangList([116, 101, 115, 116]);
        assert.ok(lst instanceof Erlang.OtpErlangList);
        assert.deepEqual(new Erlang.OtpErlangList([116, 101, 115, 116]), lst);
        assert.deepEqual([116, 101, 115, 116], lst.value);
        assert.equal('OtpErlangList([116,101,115,116],false)', lst.toString());
    }).call(this);
}).call(this);

(function ImproperListTestCase () {
    (function test_improper_list () {
        var lst = new Erlang.OtpErlangList([1, 2, 3, 4], true);
        assert.ok(lst instanceof Erlang.OtpErlangList);
        assert.deepEqual([1, 2, 3, 4], lst.value);
        assert.equal(4, lst.value[lst.value.length - 1]);
        assert.equal('OtpErlangList([1,2,3,4],true)', lst.toString());
    }).call(this);
    (function test_comparison () {
        var lst = new Erlang.OtpErlangList([1, 2, 3, 4], true);
        assert.deepEqual(lst, lst);
        assert.deepEqual(lst, new Erlang.OtpErlangList([1, 2, 3, 4], true));
        assert.notDeepEqual(lst, new Erlang.OtpErlangList([1, 2, 3, 5], true));
        assert.notDeepEqual(lst, new Erlang.OtpErlangList([1, 2, 3], true));
    }).call(this);
    (function test_errors () {
        assert.throws(function() {
                          (new Erlang.OtpErlangList('invalid')).binary();
                      }, Erlang.OutputException);
    }).call(this);
}).call(this);

//(function DecodeTestCase () {
//    (function test_binary_to_term () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83z');
//                      }, Erlang.ParseException);
//    }).call(this);
//    (function test_binary_to_term_atom () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83d');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83d\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83d\0\1');
//                      }, Erlang.ParseException);
//        assert.deepEqual(new Erlang.OtpErlangAtom(''),
//                         Erlang.binary_to_term('\x83d\0\0'));
//        assert.deepEqual(new Erlang.OtpErlangAtom(''),
//                         Erlang.binary_to_term('\x83s\0'));
//        assert.deepEqual(new Erlang.OtpErlangAtom('test'),
//                         Erlang.binary_to_term('\x83d\0\4test'));
//        assert.deepEqual(new Erlang.OtpErlangAtom('test'),
//                         Erlang.binary_to_term('\x83s\4test'));
//    }).call(this);
//    (function test_binary_to_term_predefined_atom () {
//        assert.equal(true, Erlang.binary_to_term('\x83s\4true'));
//        assert.equal(false, Erlang.binary_to_term('\x83s\5false'));
//        assert.deepEqual(new Erlang.OtpErlangAtom('undefined'),
//                         Erlang.binary_to_term('\x83d\0\11undefined'));
//    }).call(this);
//    (function test_binary_to_term_empty_list () {
//        assert.deepEqual(new Erlang.OtpErlangList([]),
//                         Erlang.binary_to_term('\x83j'));
//    }).call(this);
//    (function test_binary_to_term_string_list () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83k');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83k\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83k\0\1');
//                      }, Erlang.ParseException);
//        assert.equal('', Erlang.binary_to_term('\x83k\0\0'));
//        assert.equal('test', Erlang.binary_to_term('\x83k\0\4test'));
//    }).call(this);
//    (function test_binary_to_term_list () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.deepEqual(new Erlang.OtpErlangList([]),
//                         Erlang.binary_to_term('\x83l\0\0\0\0j'));
//        assert.deepEqual(new Erlang.OtpErlangList([
//                             new Erlang.OtpErlangList([]),
//                             new Erlang.OtpErlangList([])]),
//                         Erlang.binary_to_term('\x83l\0\0\0\2jjj'));
//    }).call(this);
//    (function test_binary_to_term_improper_list () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83l\0\0\0\0k');
//                      }, Erlang.ParseException);
//        var lst = Erlang.binary_to_term('\x83l\0\0\0\1jd\0\4tail');
//        assert.ok(lst instanceof Erlang.OtpErlangList);
//        assert.deepEqual([new Erlang.OtpErlangList([]),
//                          new Erlang.OtpErlangAtom('tail')], lst.value);
//        assert.equal(true, lst.improper);
//    }).call(this);
//    (function test_binary_to_term_small_tuple () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83h');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83h\1');
//                      }, Erlang.ParseException);
//        assert.deepEqual([], Erlang.binary_to_term('\x83h\0'));
//        assert.deepEqual([new Erlang.OtpErlangList([]),
//                          new Erlang.OtpErlangList([])],
//                         Erlang.binary_to_term('\x83h\2jj'));
//    }).call(this);
//    (function test_binary_to_term_large_tuple () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83i');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83i\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83i\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83i\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83i\0\0\0\1');
//                      }, Erlang.ParseException);
//        assert.deepEqual([], Erlang.binary_to_term('\x83i\0\0\0\0'));
//        assert.deepEqual([new Erlang.OtpErlangList([]),
//                          new Erlang.OtpErlangList([])],
//                         Erlang.binary_to_term('\x83i\0\0\0\2jj'));
//    }).call(this);
//    (function test_binary_to_term_small_integer () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83a');
//                      }, Erlang.ParseException);
//        assert.equal(0, Erlang.binary_to_term('\x83a\0'));
//        assert.equal(255, Erlang.binary_to_term('\x83a\xff'));
//    }).call(this);
//    (function test_binary_to_term_integer () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83b');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83b\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83b\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83b\0\0\0');
//                      }, Erlang.ParseException);
//        assert.equal(0, Erlang.binary_to_term('\x83b\0\0\0\0'));
//        assert.equal(2147483647,
//                     Erlang.binary_to_term('\x83b\x7f\xff\xff\xff'));
//        assert.equal(-2147483648,
//                     Erlang.binary_to_term('\x83b\x80\0\0\0'));
//        assert.equal(-1, Erlang.binary_to_term('\x83b\xff\xff\xff\xff'));
//    }).call(this);
//    (function test_binary_to_term_binary () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83m');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83m\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83m\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83m\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83m\0\0\0\1');
//                      }, Erlang.ParseException);
//        assert.deepEqual(new Erlang.OtpErlangBinary(''),
//                         Erlang.binary_to_term('\x83m\0\0\0\0'));
//        assert.deepEqual(new Erlang.OtpErlangBinary('data'),
//                         Erlang.binary_to_term('\x83m\0\0\0\4data'));
//    }).call(this);
//    (function test_binary_to_term_float () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83F\0\0\0\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.equal(0.0, Erlang.binary_to_term('\x83F\0\0\0\0\0\0\0\0'));
//        assert.equal(1.5, Erlang.binary_to_term('\x83F?\xf8\0\0\0\0\0\0'));
//    }).call(this);
//    (function test_binary_to_term_small_big_integer () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83n');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83n\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83n\1\0');
//                      }, Erlang.ParseException);
//        assert.equal(0, Erlang.binary_to_term('\x83n\0\0'));
//        assert.equal(6618611909121,
//                     Erlang.binary_to_term('\x83n\6\0\1\2\3\4\5\6'));
//        assert.equal(-6618611909121,
//                     Erlang.binary_to_term('\x83n\6\1\1\2\3\4\5\6'));
//    }).call(this);
//    (function test_binary_to_term_big_integer () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83o\0\0\0\1\0');
//                      }, Erlang.ParseException);
//        assert.equal(0, Erlang.binary_to_term('\x83o\0\0\0\0\0'));
//        assert.equal(6618611909121,
//                     Erlang.binary_to_term('\x83o\0\0\0\6\0\1\2\3\4\5\6'));
//        assert.equal(-6618611909121,
//                     Erlang.binary_to_term('\x83o\0\0\0\6\1\1\2\3\4\5\6'));
//    }).call(this);
//    (function test_binary_to_term_compressed_term () {
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83P');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83P\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83P\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83P\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() {
//                          Erlang.binary_to_term('\x83P\0\0\0\0');
//                      }, Erlang.ParseException);
//        assert.throws(function() { Erlang.binary_to_term(
//            '\x83P\0\0\0\x16\x78\xda\xcb\x66\x10\x49\xc1\2\0\x5d\x60\x08\x50'
//            ); }, Erlang.ParseException);
//        assert.equal(
//            'd'.repeat(20),
//            Erlang.binary_to_term(
//                Erlang.term_to_binary('d'.repeat(20), false)));
//        assert.equal(
//            '\x83P\0\0\0\x17\x78\xda\xcb\x66' +
//            '\x10\x49\xc1\2\0\x5d\x60\x08\x50',
//            Erlang.term_to_binary('d'.repeat(20), 9));
//        //assert.equal('d'.repeat(20),
//        //    Erlang.binary_to_term('\x83P\0\0\0\x17\x78\xda\xcb\x66' +
//        //                          '\x10\x49\xc1\2\0\x5d\x60\x08\x50'));
//    }).call(this);
//}).call(this);
