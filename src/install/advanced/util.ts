import { log } from "vortex-api";
import * as path from 'path';
import { InstructionType } from "vortex-api/lib/extensions/mod_management/types/IInstallResult";
import { InstructionExtender } from "./types";

export const groupBy = function<T> (arr: T[], criteria: ((obj:T) => string)): {[key: string]: T[]} {
	return arr.reduce<{[key: string]: T[]}>(function (obj, item) {

		// Check if the criteria is a function to run on the item or a property of it
		var key = typeof criteria === 'function' ? criteria(item) : item[criteria];

		// If the key doesn't exist yet, create it
		if (!obj.hasOwnProperty(key)) {
			obj[key] = [];
		}

		// Push the value to the object
		obj[key].push(item);

		// Return the object to the next item in the loop
		return obj;

	}, {});
};

export function buildFlatInstructions(modFileExt: string, files: string[], rootPath: string, sourceFilter?: (sourceFile: string) => boolean) {
    log('debug', 'building installer instructions', {rootPath, files});
    let filtered = files.filter(f => (!f.endsWith(path.sep)) && path.dirname(f) == rootPath);
    if (sourceFilter) {
        filtered = filtered.filter(ff => sourceFilter(ff));
    }
    log('debug', 'filtered extraneous files', { root: rootPath, candidates: filtered });
    const instructions = filtered.map(file => {
        // const destination = file.substr(firstType.indexOf(path.basename(root)) + root.length).replace(/^\\+/g, '');
        var destination = rootPath == '.' ? file : path.join(file.substr(file.indexOf(rootPath) + rootPath.length + 1));
        if (path.extname(destination).toLowerCase() == modFileExt && !destination.endsWith('_P.pak')) {
            log('debug', 'detected non-suffixed PAK file!', {destination});
            destination = destination.replace('.pak', '_P.pak');
        }
        return {
            type: 'copy' as InstructionType,
            source: file,
            destination: destination
        }
    });
    return instructions;
}

/**
 * A convenience function to create an extender that will add the file names of all files of a specific extension being installed.
 * This will add them to the installedPaks attribute as an array of the source instruction.
 * @param fileExt The mod file extension (including leading period)
 */
export function addInstalledPaksAttribute(fileExt: string = '.pak'): InstructionExtender {
    return (instructions) => {
        var paks = instructions
            .filter(i => path.extname(i.source).toLowerCase() == fileExt)
            .map(pf => pf.source);
        if (paks) {
            return [
                {
                    type: 'attribute',
                    key: 'installedPaks',
                    value: paks as any
                }
            ]
        };
    }
}