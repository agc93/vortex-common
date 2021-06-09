import { IInstruction, IState, ISupportedResult } from "vortex-api/lib/types/api";

/**
 * Describes the result of a compatibility test.
 * 
 * - `None` will proceed with the installation
 * - `RequiresConfirmation` will prompt the user with a scary warning but allow for proceeding anyway
 * - `Invalid` will forcibly fail the install process.
 */
export enum CompatibilityResult {
    None,
    RequiresConfirmation,
    Invalid
}

/**
 * A simple type for testing the compatibility of an in-progress installer, useful for catching errors that can only be picked up during install, 
 * or which can be corrected automatically.
 */
export type CompatibilityTest = {
    test: (files: string[], destinationPath: string) => CompatibilityResult,
    message: string;
    shortMessage: string;
};

/**
 * A test to determine if an installer supports a given file installation.
 */
export type InstallSupportedTest = (files: string[], gameId: string, state: IState) => Promise<ISupportedResult>

/**
 * A processor that will attach additional instructions during the installation process, after the file choice phase.
 * 
 * @remarks You should not be using this type directly.
 */
export type InstructionProcessor = {
    test: (state: IState) => boolean;
    generate: InstructionExtender
}

export type GroupedPaths = { [key: string]: string[] }

/**
 * An instruction extender can be used to add instructions to a mod during the install process. These can be additional files or attributes.
 * 
 * @param instructions This will include the compiled instructions for *only* the files chosen by the user.
 * @param files This will be *all* the files passed to the installer.
 * @param modName The current mod name.
 */
export type InstructionExtender = (instructions: IInstruction[], files: string[], modName: string) => PromiseLike<IInstruction[]>

export interface IAdvancedInstallerOptions {
    rootFolderLimit?: number,
    messages: IAdvancedInstallerMessages,
    gameId: string;
    preTest?: CompatibilityTest,
    modFileExt?: string;
}

/**
 * Messages used during errors/warnings in the installer.
 */
export interface IAdvancedInstallerMessages {
    /**
     * This message is shown when more than one valid mod file is found in an install location.
     */
    multipleFiles: string;
    /**
     * This function returns the message shown when there are more than one possible candidates for installation location.
     * 
     * @param roots The relative paths of the detected installation locations.
     */
    multipleRoots: (roots: string[]) => string;
    /**
     * This message is shown when a mod file being installed exceeds the installer's limit of possible installation locations.
     */
    largeModWarning: string;
}