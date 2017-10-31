export namespace Erlang {

  // Exception objects listed alphabetically

  export class InputException extends Error {
    constructor(message);
  }

  export class OutputException extends Error {
    constructor(message);
  }

  export class ParseException extends Error {
    constructor(message);
  }

  //  Erlang term objects listed alphabetically

  abstract class OtpErlangTerm {
    public value;

    binary(): Buffer;

    toString(): string;
  }

  export class OtpErlangAtom extends OtpErlangTerm {
    constructor(value, utf8);
  }

  export class OtpErlangBinary extends OtpErlangTerm {
    constructor(value, bits);
  }

  export class OtpErlangFunction extends OtpErlangTerm {
    constructor(tag, value);
  }

  export class OtpErlangList extends OtpErlangTerm {
    constructor(value, improper);
  }

  export class OtpErlangMap extends OtpErlangTerm {
    constructor(value);
  }

  export class OtpErlangPid extends OtpErlangTerm {
    constructor(node, id, serial, creation);
  }

  export class OtpErlangPort extends OtpErlangTerm {
    constructor(node, id, creation);
  }

  export class OtpErlangReference extends OtpErlangTerm {
    constructor(node, id, creation);
  }

  // core functionality

  export type CompressLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /* to auto unwrap OtpErlangMap or not */
  export type Option = "auto_unwrap" | "no_unwrap";

  export function binary_to_term(data, callback, option?: Option);

  export function term_to_binary(term, callback, compressed?: boolean | CompressLevel);

}
