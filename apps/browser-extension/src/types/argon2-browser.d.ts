declare module 'argon2-browser/dist/argon2-bundled.min.js' {
  interface IArgon2Options {
    pass: string;
    salt: string;
    time: number;
    mem: number;
    parallelism: number;
    hashLen: number;
    type: number;
  }

  interface IArgon2Result {
    hash: Uint8Array;
    hashHex: string;
  }

  export function hash(options: IArgon2Options): Promise<IArgon2Result>;
  
  const argon2: {
    hash: (options: IArgon2Options) => Promise<IArgon2Result>;
  };
  
  export default argon2;
}
