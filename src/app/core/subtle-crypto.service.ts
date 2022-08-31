import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubtleCryptoService {
  private _counter: Uint8Array = new Uint8Array();
  private _algorithm: AesCtrParams = {
      name: "AES-CTR",
      counter: this._counter,
      length: 128
    };

  constructor() {
    // this.setSession(false, false);
  }

  setSession(newSession = false, stayLoggedIn = false) {
    const storage = stayLoggedIn ? window.localStorage : window.sessionStorage;
    const counter = storage.getItem('CRYPTO_CTR');

    if (counter && !newSession) {
      this._counter = Uint8Array.from(counter.split(','), v => parseInt(v));
    } else {
      this._counter = window.crypto.getRandomValues(new Uint8Array(16));
      storage.setItem('CRYPTO_CTR', this._counter.toString())
    }

    this._algorithm = {
      name: "AES-CTR",
      counter: this._counter,
      length: 128
    };
  }

  newSession(stayLoggedIn: boolean) {
    this.setSession(true, stayLoggedIn);
  }

  private async _encrypt(password: string, data: BufferSource) {
    const key = await this._importKey(this.encodeTxtMessage(password));
    const cypher: ArrayBuffer = await crypto.subtle.encrypt(this._algorithm, key, data);
    return { c: cypher, n: this._algorithm.counter };
  }

  public encrypt(
    password: string,
    data: string): Observable<{c: ArrayBuffer, n: BufferSource}> {
    return from(this._encrypt(password, this.encodeTxtMessage(data)));
  }

  public encodeTxtMessage(msg: string) {
    const newMsg = new TextEncoder();
    return newMsg.encode(msg);
  }

  private async _decrypt(password: string, data: BufferSource) {
    const key = await this._importKey(this.encodeTxtMessage(password));
    const plaintext: ArrayBuffer = await crypto.subtle.decrypt(this._algorithm, key, data);
    return { p: plaintext, n: this._algorithm.counter };
  }

  public decrypt(
    password: string,
    data: BufferSource): Observable<{p: ArrayBuffer, n: BufferSource}> {
    return from(this._decrypt(password, data));
  }

  /*
  * https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
  */
  public async _importKey(rawKey: Uint8Array) {
    const maxBytes = 16;
    const finalKey = new Uint8Array(maxBytes);
    for (let i = 0, j = 0; i < finalKey.length && j < rawKey.length; i++,j++ ) {
      finalKey[i] = rawKey[j];
    }
    return await window.crypto.subtle.importKey(
      "raw",
      finalKey,
      "AES-CTR",
      false,
      ["encrypt", "decrypt"]
    );
  }

  public decodeTxtMessage(msg: Uint8Array|ArrayBuffer) {
    const newMsg = new TextDecoder('utf-8', { fatal: true });
    return newMsg.decode(msg);
  }

}
