import { log, util } from "vortex-api";
import { ICheckbox, IDialogResult, IExtensionApi, IInstallResult, IInstruction, ISupportedResult, ProgressDelegate } from "vortex-api/lib/types/api";
import * as path from 'path';
import { buildFlatInstructions, groupBy } from "./util";
import { IAdvancedInstallerOptions, InstructionProcessor, GroupedPaths, InstallSupportedTest, CompatibilityResult } from "./types";
import { getModName } from "../../util";



export class AdvancedInstaller {
    private _api: IExtensionApi;
    private _opts: IAdvancedInstallerOptions;
    private _processors: InstructionProcessor[];
    private _supportedChecks: InstallSupportedTest[];

    constructor(opts: IAdvancedInstallerOptions, supportedTests?: InstallSupportedTest[], processors?: InstructionProcessor[]) {
        this._opts = opts;
        this._processors = processors ?? [];
        this._supportedChecks = supportedTests ?? [];
        this._opts.modFileExt ??= '.pak';
    }

    configure = (api: IExtensionApi): AdvancedInstaller => {
        this._api = api;
        return this;
    }

    testSupported = async (files: string[], gameId: string): Promise<ISupportedResult> => {
        if (!this._api) {
            log('warn', 'advanced installer has not been configured! bailing out.');
            return Promise.resolve({supported: false, requiredFiles: []});
        }
        var state = this._api.getState();
        log('debug', `testing ${files.length} mod files for advanced unreal installer`, {files, targetGame: this._opts.gameId});
        var requiredFiles: string[] = [];
        let supported = (gameId === this._opts.gameId) &&
            (
                files.find(file => path.extname(file).toLowerCase() === this._opts.modFileExt) !== undefined
            );
        if (this._supportedChecks && this._supportedChecks.length > 0) {
            var results = await Promise.all(this._supportedChecks.map(async c => await c(files, gameId, state)));
            supported &&= results.every(r => r.supported);
            requiredFiles.concat(results.flatMap(r => r.requiredFiles));
        }
        return Promise.resolve({
            supported,
            requiredFiles,
        });
    }

    advancedInstall = async (files: string[], destinationPath: string, gameId: string, progress: ProgressDelegate): Promise<IInstallResult> => {
        //basically need to keep descending until we find a reliable indicator of mod root
        const allPaks = files.filter(file => path.extname(file).toLowerCase() === this._opts.modFileExt);
        const uniquePakRoots = groupBy(allPaks, (pakPath) => {
            return path.dirname(pakPath);
        });
        if (this._opts.preTest) {
            var preTestResult = this._opts.preTest.test(files, destinationPath);
            if (preTestResult == CompatibilityResult.RequiresConfirmation) {
                var result: IDialogResult = await this._api.showDialog('error', 'Incompatible mod structure', {
                    text: this._opts.preTest.message
                }, [
                    { label: 'Cancel Install' },
                    { label: 'Continue (unsupported)'}
                ]);
                if (result.action === 'Continue (unsupported)') {
                    this._api.sendNotification({
                        type: 'warning',
                        title: 'Installed incompatible mod',
                        message: this._opts.preTest.shortMessage ?? 'You have installed a malformed mod. You might see unexpected results.'
                    });
                    // return await advancedInstall(api, files, destinationPath, gameId, progress);
                }
                else {
                    throw new Error("Incompatible mod structure");
                }
            } else if (preTestResult == CompatibilityResult.Invalid) {
                var errMessage = this._opts?.preTest?.message || "Ensure the mod file is compatible with the current game and try again.";
                throw new Error(`Mod failed compatibility check! ${errMessage}`)
            }
        }
        let installInstructions: IInstruction[] = [];
        var keys = Object.keys(uniquePakRoots);
        this._opts.rootFolderLimit ||= 0;
        var limit = this._opts.rootFolderLimit || 0;
        if (allPaks.length > 100 || (limit > 0 && keys.length > limit)) {
            var confirmResult: IDialogResult = await this._api.showDialog('info', 'Large mod detected!', {
                text: this._opts.messages.largeModWarning
            }, [
                { label: 'Cancel' },
                { label: 'Continue' }
            ]);
            if (confirmResult.action == 'Cancel') {
                return Promise.reject(new util.UserCanceled());
            }
        }
        log('debug', 'separated pak roots', { roots: keys });
        if (!uniquePakRoots || keys.length == 0) {
            log('warn', "Couldn't find reliable root indicator in file list!");
            return Promise.reject();
        } else if (keys.length == 1) {
            if (uniquePakRoots[keys[0]].length > 1) {
                installInstructions = await this._installMultipleModArchive(keys, uniquePakRoots, files);
            } else {
                // var unrealResult = await unreal.installContent(files, destinationPath, gameId, null);
                // installInstructions = unrealResult.instructions;
                installInstructions = buildFlatInstructions(this._opts.modFileExt, files, keys[0]);
            }
        } else if (keys.length > 1) {
            installInstructions = await this._installFromMultiplePaths(uniquePakRoots, files);
        }
        let instructions = installInstructions;
        for (const processor of this._processors ?? []) {
            if (processor?.test(this._api.getState()) ?? true) {
                instructions = instructions.concat(processor?.generate(instructions, files, getModName(destinationPath)) ?? []);
            }
        }
        return Promise.resolve({ instructions });
    }

    private _installFromMultiplePaths = async (pakRoots: GroupedPaths, files: string[]): Promise<IInstruction[]> => {
        var keys = Object.keys(pakRoots);
        var result: IDialogResult = await this._api.showDialog(
            'question',
            'Multiple mod files detected',
            {
                text: this._opts.messages.multipleRoots(keys),
                checkboxes: keys.map(k => {
                    return {
                        id: k,
                        text: `${path.basename(k)} (${pakRoots[k].length} files)`
                    } as ICheckbox;
                }),
                options: {
                    translated: false
                }
            },
            [
                { label: 'Cancel' },
                { label: 'Install Selected' },
                { label: 'Install All_plural' }
            ]
        );
        if (result.action == 'Cancel') {
            return Promise.reject(new Error('Multiple mod paths located!'));
        } else if (result.action == 'Install All' || result.action == 'Install All_plural') {
            log('debug', JSON.stringify(result.input));
            let instructions: IInstruction[] = [];
            instructions = keys.flatMap(k => buildFlatInstructions(this._opts.modFileExt, files, k));
            return Promise.resolve(instructions);
        } else if (result.action == 'Install Selected') {
            var selections: string[] = Object.keys(result.input).filter(s => result.input[s]);
            // var selectedRoots = selections.map(sv => parseInt(sv.split('-')[1])).map(si => uniquePakRoots[si]);
            return await this._installMultipleModArchive(selections, pakRoots, files);
        }
    }

    private _installMultipleModArchive = async (selections: string[], pakRoots: GroupedPaths, files: string[]): Promise<IInstruction[]> => {
        var selectedRoots = selections.map(sk => pakRoots[sk]);
        if (selectedRoots.some(sr => sr.length > 1)) {

            var pakResult: IDialogResult = await this._api.showDialog(
                'question',
                'Multiple mod files detected',
                {
                    text: this._opts.messages.multipleFiles,
                    checkboxes: selectedRoots.flatMap(sr => sr).map(k => {
                        return {
                            id: k,
                            text: `${k}`,
                            value: true
                        } as ICheckbox;
                    })
                },
                [
                    { label: 'Cancel' },
                    { label: 'Install Selected' }
                ]
            );
            if (pakResult.action == 'Cancel') {
                return Promise.reject(new Error('Multiple mod paths located!'));
            } else if (pakResult.action == 'Install Selected') {
                let instructions: IInstruction[] = [];
                var modSelections: string[] = Object.keys(pakResult.input).filter(s => pakResult.input[s]);
                instructions = selections.flatMap(k => buildFlatInstructions(this._opts.modFileExt, files, k, (file) => modSelections.map(s => path.basename(s)).some(bn => bn == path.basename(file))));
                return Promise.resolve(instructions);
            }
        } else {
            var instructions = selections.flatMap(k => buildFlatInstructions(this._opts.modFileExt, files, k));
            return Promise.resolve(instructions);
        }
    }
}
