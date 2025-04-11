declare module 'react-native-argon2' {
  interface Argon2Options {
    iterations?: number;
    memory?: number;
    parallelism?: number;
    hashLength?: number;
    mode?: 'argon2i' | 'argon2d' | 'argon2id';
  }

  interface Argon2Result {
    encodedHash: string;
    rawHash: string;
  }

  function argon2(
    password: string,
    salt: string,
    options?: Argon2Options
  ): Promise<Argon2Result>;

  export default argon2;
} 