import { IExtensionApi, IInstruction, IState } from "vortex-api/lib/types/api";
import { AdvancedInstaller } from "./AdvancedInstaller";
import { CompatibilityTest, IAdvancedInstallerMessages, IAdvancedInstallerOptions, InstallSupportedTest, InstructionExtender, InstructionProcessor } from "./types";



const defaultMessages: IAdvancedInstallerMessages = {
    largeModWarning: "The mod you're trying to install includes a large number of available files and no installer files!\n\nVortex will prompt you for which files you want to install but be aware that this mod archive might contain a lot of files and folders to choose from. You may want to check the mod's description in case there are any special installation instructions you should know about.\n\nThere's unfortunately nothing Vortex can do about this as this can only be resolved by the mod author.",
    multipleFiles: 'The mod package or paths you are installing contain multiple mod files!\n\nYou can individually disable any mod files below to skip installing them or choose Install Selected to continue with all the selected files.',
    multipleRoots: (keys) => `The mod package you are installing appears to contain multiple nested mod packages! We found ${keys.length} mod locations in the archive.\n\nYou can either cancel now and verify the mod is packaged correctly, or attempt to install all of them together. This will probably cause conflicts!\n\nAlternatively, you can select only the paths you want to install from below and choose Install Selected to install paks from only those folders.`
}

export class AdvancedInstallerBuilder {
    private gameId: string;
    private preTest: CompatibilityTest;
    private processors: InstructionProcessor[];
    private messages: IAdvancedInstallerMessages;
    private supportedTests: InstallSupportedTest[];
    private _fileExt: string;
    private _rootsLimit: number;
    /**
     *
     */
    constructor(gameId: string, modFileExt?: string, warnOnFileRoots?: number) {
        this.gameId = gameId;
        this.processors = [];
        this.supportedTests = [];
        this._fileExt == modFileExt ?? '.pak';
        this._rootsLimit = warnOnFileRoots || 9;
    }

    addCompatibilityTest = (testFunc: CompatibilityTest): AdvancedInstallerBuilder => {
        this.preTest = testFunc;
        return this;
    }

    addExtender = (processor: InstructionExtender, test?: (state: IState) => boolean): AdvancedInstallerBuilder => {
        var testFunc = test ? test : (state: IState) => true;
        this.processors.push({ generate: processor, test: testFunc });
        return this;
    }

    addSupportedCheck = (check: InstallSupportedTest): AdvancedInstallerBuilder => {
        this.supportedTests.push(check);
        return this;
    }

    useCustomMessages = (messages: IAdvancedInstallerMessages): AdvancedInstallerBuilder => {
        this.messages = messages;
        return this;
    }

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

