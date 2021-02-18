import { IInstruction, IState, ISupportedResult } from "vortex-api/lib/types/api";

export enum CompatibilityResult {
    None,
    RequiresConfirmation,
    Invalid
}

export type CompatibilityTest = {
    test: (files: string[], destinationPath: string) => CompatibilityResult,
    message: string;
    shortMessage: string;
};

export type InstallSupportedTest = (files: string[], gameId: string, state: IState) => Promise<ISupportedResult>

export type InstructionProcessor = {
    test: (state: IState) => boolean;
    generate: InstructionExtender
}

export type GroupedPaths = { [key: string]: string[] }

export type InstructionExtender = (instructions: IInstruction[], files: string[], modName: string) => IInstruction[]
// type InstructionExenderTest = 

export interface IAdvancedInstallerOptions {
    rootFolderLimit?: number,
    messages: IAdvancedInstallerMessages,
    gameId: string;
    preTest?: CompatibilityTest,
    modFileExt?: string;
}

export interface IAdvancedInstallerMessages {
    multipleFiles: string;
    multipleRoots: (roots: string[]) => string;
    largeModWarning: string;
}