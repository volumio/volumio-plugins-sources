// Used for converting Object values to string literal types:
// https://dev.to/multimo/how-to-build-typescript-string-literal-types-from-objects-values-361l
export type ValueOf<T> = T[keyof T];
