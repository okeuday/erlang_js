import {Erlang} from "./Erlang";

export function term_to_binary(term, compressed: boolean | Erlang.CompressLevel = true) {
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

export function binary_to_term(data, option: Erlang.Option = "auto_unwrap") {
  return new Promise((resolve, reject) => {
    Erlang.binary_to_term(data, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }, option);
  });
}
