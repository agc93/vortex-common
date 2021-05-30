import { LoadOrderFilter } from "./types";

/**
 * A simple filter to exclude all non-default mod types.
 * 
 * @param val The load order entry.
 * @param mod The mod.
 * @returns `true` if the mod is the default type, otherwise `false`
 */
export const excludeNonDefaultTypes: LoadOrderFilter = (val, mod) => {
    return mod ? mod.type == '' : false; //only include default mod types
};