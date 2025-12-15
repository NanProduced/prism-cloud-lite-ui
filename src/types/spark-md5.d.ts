// Local TypeScript typings shim for `spark-md5`.
// Reason: the package ships JS files only in our current setup, and we want a strict, typed import without adding extra deps.
// Keep this minimal and aligned with the subset we use (ArrayBuffer hasher for chunked MD5).

declare module 'spark-md5' {
  export interface SparkMD5ArrayBufferHasher {
    append(buffer: ArrayBuffer): this;
    end(raw?: boolean): string;
    reset(): this;
  }

  export interface SparkMD5Static {
    ArrayBuffer: new () => SparkMD5ArrayBufferHasher;
    hash(message: string, raw?: boolean): string;
    hashBinary(message: string, raw?: boolean): string;
  }

  const SparkMD5: SparkMD5Static;
  export default SparkMD5;
}
