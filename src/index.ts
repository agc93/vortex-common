/**
 * A collection of utility functions, objects and types for simplifying common logic in Vortex extensions.
 * 
 * Note that this default module only includes common utility components and some generic types. 
 * Check the other modules included in the package for more specialized components.
 * 
 * Import types from this module using 
 * ```typescript
 * import { } from "vortex-ext-common";
 * ```
 * 
 * @module
 */

export { ProfileClient } from './profileClient';
export { UnrealGameHelper }  from './unreal';
export * from './util';
import * as installer from './install';
export { installer };
