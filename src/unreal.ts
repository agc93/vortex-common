import path = require('path');
import { IDiscoveryResult, ProgressDelegate, IInstallResult } from "vortex-api/lib/types/api";
import { fs, log } from 'vortex-api';
import { InstructionType, IInstruction } from 'vortex-api/lib/extensions/mod_management/types/IInstallResult';

/**
 * A simple class to encapsulate some commonly-used parts of a game extension for a UE-based game
 *
 * @remarks
 * You need to provide a valid gameId at instantiation or it will fail in weird ways.
 */
export class UnrealGameHelper {
    public targetGameId: string;
    /**
     * This callback is used to determine whether the installer will try and install mods that don't look *quite* right.
     * 
     * @remarks
     * - Essentially, if this callback returns true (defaults to false), the installer will still attempt to install mod files even if it can't find the `.pak` file.
     * - This *shouldn't* be possible since the installer checks for a `.pak` file but weirder things have happened.
     */
    public enableFallback: () => boolean;

    /**
     * DO NOT USE. This is future functionality to control fallback installer logic
     * 
     * @beta
     */
    // private fallbackInstaller: (files: string[], destinationPath: string, gameId: string, progressDelegate: ProgressDelegate) => Promise<IInstallResult>;

    private modFileExt: string;
    /**
     * Creates a new helper for the given gameId.
     */
    constructor(gameId: string, enableFallback?: boolean) {
        this.modFileExt = '.pak';
        this.targetGameId = gameId;
        this.enableFallback = () => enableFallback ?? false;
    }

    /**
     * An implementation of the `setup` pattern for UE-based games
     * 
     * @remarks
     * - relativePath will usually be the result of, for example, `path.join('Game', 'Content', 'Paks', '~mods')`
     * 
     * @param discovery The discovery result
     * @param relativePath The relative path to the mods folder.
     */
    prepareforModding = async (discovery: IDiscoveryResult, relativePath: string): Promise<void> => {
        return fs.ensureDirWritableAsync(path.join(discovery.path, relativePath));
    }

    /**
     * An implementation of the installer test function for the UnrealGameHelper.installContent installer.
     * 
     * @param files The files list
     * @param gameId The current gameId
     */
    testSupportedContent = (files: string[], gameId: string) => {
        // Make sure we're able to support this mod.
        log('debug', `testing ${files.length} mod files for unreal installer`, {files, targetGame: this.targetGameId});
        let supported = (gameId === this.targetGameId) &&
            (
                (files.find(file => path.extname(file).toLowerCase() === this.modFileExt) !== undefined)
                || this.enableFallback
            );

        return Promise.resolve({
            supported,
            requiredFiles: [],
        });
    }

    /**
     * A simple installer for UE games that deploys files rooted to the first `.pak` file into the default location.
     * 
     * @param files The file list
     * @param destinationPath The installation destination path.
     * @param gameId The ID of the game to install for
     * @param progressDelegate [NOT USED] Callback for reporting installation progress
     */
    installContent = async (files: string[], destinationPath: string, gameId: string, progressDelegate: ProgressDelegate): Promise<IInstallResult> => {
        log('debug', `running unreal installer. [${gameId}]`, { files, destinationPath });
        //basically need to keep descending until we find a reliable indicator of mod root
        const modFile = files.find(file => path.extname(file).toLowerCase() === this.modFileExt);
        if (modFile) {
            // we found a pak file, so disregard anything outside of that
            const idx = modFile.indexOf(path.basename(modFile));
            const rootPath = path.dirname(modFile);
            const filtered = files.filter(file =>
                ((file.indexOf(rootPath) !== -1)
                    && (!file.endsWith(path.sep))));

            // const filtered = files.filter(file => (((root == "." ? true : (file.indexOf(root) !== -1)) && (!file.endsWith(path.sep)))));
            log('debug', 'filtered extraneous files', { root: rootPath, candidates: filtered });
            const instructions = filtered.map(file => {
                // const destination = file.substr(firstType.indexOf(path.basename(root)) + root.length).replace(/^\\+/g, '');
                const destination = path.join(file.substr(idx));
                return {
                    type: 'copy' as InstructionType,
                    source: file,
                    destination: destination
                }
            });
            return Promise.resolve({ instructions });
        } else {
            if (this.enableFallback?.()) {
                log('warn', "Couldn't find reliable root indicator in file list. Falling back to basic installation!");
                var instructions = files.map((file: string): IInstruction => {
                    return {
                        type: 'copy',
                        source: file,
                        destination: file,
                    };
                });
                return Promise.resolve({ instructions });
            } else {
                log('error', "Couldn't find reliable root indicator in file list. Failing installation!");
                return Promise.reject("Could not determine root of mod package.");
            }
        }
    }
}