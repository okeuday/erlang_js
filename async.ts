import {Erlang} from "./Erlang";
import * as arraybufferToBuffer from "arraybuffer-to-buffer";

export function term_to_binary(term, compressed: boolean | Erlang.CompressLevel = true): Promise<Buffer | Uint8Array> {
  return new Promise((resolve, reject) => {
    Erlang.term_to_binary(term, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }, compressed);
  });
}

export function binary_to_term(data: Blob | Buffer | Uint8Array, option: Erlang.Option = "auto_unwrap") {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(data)) {
      resolve(data);
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve(arraybufferToBuffer(reader.result));
      reader.onerror = e => reject(e);
      reader.readAsArrayBuffer(data as Blob);
    }
  })
    .then(buffer => new Promise((resolve, reject) => {
      Erlang.binary_to_term(buffer, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      }, option);
    }));
}
