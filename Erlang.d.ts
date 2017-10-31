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
    binary(): Buffer;

    toString(): string;
  }

  export class OtpErlangAtom extends OtpErlangTerm {
    public value;

    public utf8: boolean;

    constructor(value, utf8?: boolean);
  }

  export class OtpErlangBinary extends OtpErlangTerm {
    public value;

    public bits: number;

    constructor(value, bits?: number);
  }

  export class OtpErlangFunction extends OtpErlangTerm {
    public tag;
    public value;

    constructor(tag, value);
  }

  export class OtpErlangList extends OtpErlangTerm {
    public value;

    public improper: boolean;

    constructor(value, improper?: boolean);
  }

  export class OtpErlangMap extends OtpErlangTerm {
    public value;

    constructor(value);
  }

  export class OtpErlangPid extends OtpErlangTerm {
    public node;
    public id;
    public serial;
    public creation;

    constructor(node, id, serial, creation);
  }

  export class OtpErlangPort extends OtpErlangTerm {
    public node;
    public id;
    public creation;

    constructor(node, id, creation);
  }

  export class OtpErlangReference extends OtpErlangTerm {
    public node;
    public id;
    public creation;

    constructor(node, id, creation);
  }

  // core functionality

  export type CompressLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /* to auto unwrap OtpErlangMap or not */
  export type Option = "auto_unwrap" | "no_unwrap";

  export function binary_to_term(data, callback, option?: Option);

  export function term_to_binary(term, callback, compressed?: boolean | CompressLevel);

}
