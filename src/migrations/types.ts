

export type ExtensionUpdateInfo = {
    name: string;
    newVersion: string;
    requiredVortexVersion?: string;
    releaseNotes?: string;
    oldVersion?: string;
}