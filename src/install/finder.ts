import { basename, sep, dirname } from "path";

export class InstallRootFinder {
    private _rootFuncs: {predicate: (value: string) => boolean, useParent?: boolean}[];
    /**
     *
     */
    constructor() {
        this._rootFuncs = [];
        
    }
    addSearch(predicate: (value: string) => boolean): InstallRootFinder {
        this._rootFuncs.push({predicate});
        return this;
    }
    addFileRoot(fileName: string, ignoreCase = true, useParent = false): InstallRootFinder {
        var predicate: (v: string) => boolean = ignoreCase
            ? (v) => basename(v).toLowerCase().indexOf(fileName.toLowerCase()) !== -1
            : (v) => basename(v).indexOf(fileName) !== -1;
        this._rootFuncs.push({predicate: (v) => predicate(v) && !v.endsWith(sep), useParent});
        return this;
    }

    addFolderRoot(folderName: string, ignoreCase = true, useParent = false): InstallRootFinder {
        var predicate: (v: string) => boolean = ignoreCase
            ? (v) => basename(v).toLowerCase().indexOf(folderName.toLowerCase()) !== -1
            : (v) => basename(v).indexOf(folderName) !== -1;
        this._rootFuncs.push({predicate, useParent});
        return this;
    }

    getRoot(files: string[]) : string|undefined {
        var validRoot: string = undefined;
        var i: number = 0;
        do {
            var p = this._rootFuncs[i];
            var candidate = files.find(p.predicate);
            if (candidate) {
                validRoot = p.useParent ? dirname(candidate) : candidate;
            }
            i++;
        } while (validRoot == undefined && i < files.length);
        return validRoot;
    }

    getRoots(files: string[]): string[] {
        var roots: string[] = [];
        for (const check of this._rootFuncs) {
            var candidates = files.filter(check.predicate);
            if (candidates && candidates.length > 0) {
                candidates = check.useParent ? candidates.map(c => dirname(c)) : candidates;
                roots.push(...candidates);
            }
        }
        return roots;
    }
}