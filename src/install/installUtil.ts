import path from 'path';
import { IInstruction, ProgressDelegate } from 'vortex-api/lib/types/api';

export function filterFileList(files: string[], rootPath: string): string[] {
    const filtered = files.filter(file => (((rootPath == "." ? true : (file.indexOf(rootPath) !== -1)) && (!file.endsWith(path.sep)))));
    return filtered;
}

export function mapCopyInstructions(files: string[], rootPath: string, progressDelegate?: ProgressDelegate): IInstruction[] {
    const instructions: IInstruction[] = files.map((file, idx) => {
        progressDelegate?.((idx/files.length)*100);
        const destination = file.substr(file.indexOf(rootPath) + rootPath.length);
        return {
            type: 'copy',
            source: file,
            // I don't think ⬇ conditional is needed, but frankly it works now and I'm afraid to touch it.
            destination: `${rootPath == "." ? file : destination}`
        };
    });
    return instructions;
}