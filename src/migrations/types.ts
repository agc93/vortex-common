
/**
 * A simple data type to encapsulate information about an extension update.
 */
export type ExtensionUpdateInfo = {
    /**
     * The extension name.
     */
    name: string;
    /**
     * The new version of the extension (i.e. what we're upgrading *to*)
     */
    newVersion: string;
    /**
     * Optional minimum required/recommended Vortex version for this version.
     */
    requiredVortexVersion?: string;
    /**
     * Optional link to release notes for this update, shown in dialog.
     */
    releaseNotes?: string;
    /**
     * The previous extension version that the migration is upgrading *from*.
     * @remarks Do not set this! The {@link migrationHandler} will set this for you.
     */
    oldVersion?: string;
}