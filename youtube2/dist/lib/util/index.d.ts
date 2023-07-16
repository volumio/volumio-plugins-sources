export declare function sleep(ms: number): Promise<unknown>;
export declare function rnd(min: number, max: number): number;
/**
 * Recursively match each property of `obj` against `predicate` and returns the values of matches.
 * @param {*} obj
 * @param {*} predicate `function(key, value)`
 * @returns List of values of matched properties. Only deepest matches are included.
 */
export declare function findInObject(obj: object | Array<any>, predicate: (key: string, value: any) => boolean): any[];
export declare function jsPromiseToKew<T>(promise: Promise<T>): any;
export declare function kewToJSPromise(promise: any): Promise<any>;
//# sourceMappingURL=index.d.ts.map