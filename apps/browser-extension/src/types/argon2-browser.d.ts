declare module 'argon2-browser/dist/argon2-bundled.min.js' {
  interface Argon2Options {
    pass: string;
    salt: string;
    time: number;
    mem: number;
    parallelism: number;
    hashLen: number;
    type: number;
  }

  interface Argon2Result {
    hash: Uint8Array;
    hashHex: string;
  }

  export function hash(options: Argon2Options): Promise<Argon2Result>;
  
  const argon2: {
    hash: (options: Argon2Options) => Promise<Argon2Result>;
  };
  
  export default argon2;
}
