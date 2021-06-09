/**
 * This module provides a ready-to-use "advanced" installer, designed mostly for use with UE4 games.
 * 
 * In particular, this installer allows for interactive user selection during files of what files/variants to install, 
 * as well as being highly configurable so that game-specific behaviour can be handled without having to reinvent the wheel.
 * 
 * Import types from this module using 
 * ```typescript
 * import { AdvancedInstallerBuilder } from 'vortex-ext-common/install/advanced'
 * ```
 * 
 * @module
 */

export {AdvancedInstallerBuilder} from './builder'
export {CompatibilityTest, InstallSupportedTest, InstructionExtender, IAdvancedInstallerMessages, CompatibilityResult} from './types'
export {AdvancedInstaller} from './AdvancedInstaller'
export {addInstalledPaksAttribute} from './util'