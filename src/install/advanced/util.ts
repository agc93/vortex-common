import { log } from "vortex-api";
import * as path from 'path';
import { InstructionType } from "vortex-api/lib/extensions/mod_management/types/IInstallResult";

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