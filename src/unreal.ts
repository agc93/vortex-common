import path = require('path');
import { IDiscoveryResult, ProgressDelegate } from "vortex-api/lib/types/api";
import { fs, log } from 'vortex-api';
import { InstructionType, IInstruction } from 'vortex-api/lib/extensions/mod_management/types/IInstallResult';

export class UnrealGameHelper {
    gameId: string;
    enableFallback: boolean;
    private modFileExt: string;
    /**
     *
     */
    constructor(gameId: string, enableFallback?: boolean) {
        this.modFileExt = '.pak';
        this.gameId = gameId;
        this.enableFallback = enableFallback ?? false;
    }

    async prepareforModding(discovery: IDiscoveryResult, relativePath: string): Promise<void> {
        return fs.ensureDirWritableAsync(path.join(discovery.path, relativePath));
    }

    testSupportedContent(files: string[], gameId: string) {
        // Make sure we're able to support this mod.
        let supported = (gameId === this.gameId) &&
            (files.find(file => path.extname(file).toLowerCase() === this.modFileExt) !== undefined);

        if (supported && files.find(file =>
            (path.basename(file).toLowerCase() === 'moduleconfig.xml')
            && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
            supported = false;
        }

        return Promise.resolve({
            supported,
            requiredFiles: [],
        });
    }

    async installContent(files: string[], destinationPath: string, gameId: string, progressDelegate: ProgressDelegate) {
        log('debug', `running acevortex installer. [${gameId}]`, { files, destinationPath });
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
            if (this.enableFallback) {
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