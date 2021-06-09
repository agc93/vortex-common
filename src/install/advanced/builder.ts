import { IExtensionApi, IInstruction, IState } from "vortex-api/lib/types/api";
import { AdvancedInstaller } from "./AdvancedInstaller";
import { CompatibilityTest, IAdvancedInstallerMessages, IAdvancedInstallerOptions, InstallSupportedTest, InstructionExtender, InstructionProcessor } from "./types";



const defaultMessages: IAdvancedInstallerMessages = {
    largeModWarning: "The mod you're trying to install includes a large number of available files and no installer files!\n\nVortex will prompt you for which files you want to install but be aware that this mod archive might contain a lot of files and folders to choose from. You may want to check the mod's description in case there are any special installation instructions you should know about.\n\nThere's unfortunately nothing Vortex can do about this as this can only be resolved by the mod author.",
    multipleFiles: 'The mod package or paths you are installing contain multiple mod files!\n\nYou can individually disable any mod files below to skip installing them or choose Install Selected to continue with all the selected files.',
    multipleRoots: (keys) => `The mod package you are installing appears to contain multiple nested mod packages! We found ${keys.length} mod locations in the archive.\n\nYou can either cancel now and verify the mod is packaged correctly, or attempt to install all of them together. This will probably cause conflicts!\n\nAlternatively, you can select only the paths you want to install from below and choose Install Selected to install paks from only those folders.`
}

/**
 * A fluent builder for the advanced installer to simplify configuration.
 */
export class AdvancedInstallerBuilder {
    private gameId: string;
    private preTest: CompatibilityTest;
    private processors: InstructionProcessor[];
    private messages: IAdvancedInstallerMessages;
    private supportedTests: InstallSupportedTest[];
    private _fileExt: string;
    private _rootsLimit: number;
    
    /**
     * Creates a new instance of the builder for configuration.
     * 
     * @param gameId The game ID for this installer.
     * @param modFileExt The mod file extension, defaults to `.pak`.
     * @param warnOnFileRoots The maximum number of installation root options before warning the user.
     */
    constructor(gameId: string, modFileExt?: string, warnOnFileRoots?: number) {
        this.gameId = gameId;
        this.processors = [];
        this.supportedTests = [];
        this._fileExt == modFileExt ?? '.pak';
        this._rootsLimit = warnOnFileRoots || 9;
    }

    /**
     * Adds a compatibility test to be run during install to catch malformed or incompatible mods.
     * 
     * @remarks Unlike extenders and support tests, there can only be one compatibility test. Calling this again will replace earlier tests.
     * 
     * @param testFunc The function to test compatibility during install.
     * @returns The builder.
     */
    addCompatibilityTest = (testFunc: CompatibilityTest): AdvancedInstallerBuilder => {
        this.preTest = testFunc;
        return this;
    }

    /**
     * Adds an instruction extender for including additional instructions during install.
     * 
     * @remarks Instruction extenders are called *after* the user has chosen what files to install.
     * 
     * @param processor The instruction extender to be invoked during installation.
     * @param test An optional test to determine whether to run the extender.
     * @returns The builder.
     */
    addExtender = (processor: InstructionExtender, test?: (state: IState) => boolean): AdvancedInstallerBuilder => {
        var testFunc = test ? test : (state: IState) => true;
        this.processors.push({ generate: processor, test: testFunc });
        return this;
    }

    /**
     * Adds a check to be run to determine if the current installer supports the file being installed.
     * 
     * @param check A supported file check to invoke before running the main installer.
     * @returns The builder.
     */
    addSupportedCheck = (check: InstallSupportedTest): AdvancedInstallerBuilder => {
        this.supportedTests.push(check);
        return this;
    }

    /**
     * Adds custom messages to be used for common error/warning scenarios.
     * 
     * @param messages The custom messages.
     * @returns The builder.
     */
    useCustomMessages = (messages: IAdvancedInstallerMessages): AdvancedInstallerBuilder => {
        this.messages = messages;
        return this;
    }

    /**
     * Builds an installer using the currently configured options and components.
     * 
     * @returns The installer to use in your extension's registration.
     */
    build = (): AdvancedInstaller => {
        var opts: IAdvancedInstallerOptions = {
            gameId: this.gameId,
            messages: this.messages ?? defaultMessages,
            modFileExt: this._fileExt ?? '.pak',
            preTest: this.preTest,
            rootFolderLimit: this._rootsLimit
        }
        return new AdvancedInstaller(opts, this.supportedTests || [], this.processors || [])
    }
}

