/**
 * A simple wrapper over the Vortex migration API to make writing migrations a little easier.
 * 
 * Import types from this module using 
 * ```typescript
 * import {} from 'vortex-ext-common/migrations'
 * ```
 * 
 * @module
 */

export * from './types'
export {migrationHandler} from './handler'
export * from './util';