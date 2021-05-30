import { util } from "vortex-api";
import { IDialogContent, IDialogResult, IExtensionApi } from "vortex-api/lib/types/api";
import { ExtensionUpdateInfo } from "./types";

/**
 * Shows a notification warning users that an updated extension version requires a specific version of Vortex.
 * 
 * @param api The extension API.
 * @param extInfo The extension update this notification is referencing.
 * @param message The message to show to users in the details dialog.
 * @param callback A callback to run *after* the dialog is closed.
 * @returns The notification ID.
 */
export function requireVortexVersionNotification(api: IExtensionApi, extInfo: ExtensionUpdateInfo, message: string, callback?: () => void) {
    return api.sendNotification({
        id: 'extension-requires-upgrade',
        type: 'warning',
        message: api.translate('{{extName}} requires Vortex v{{vortexVersion}} or higher!',
            {vortexVersion: extInfo.requiredVortexVersion, extName: extInfo.name }),
        noDismiss: true,
        actions: [
            {
                title: 'Explain',
                action: (dismiss) => {
                    api.showDialog('info', extInfo.name, {
                        text: api.translate(message),
                    }, [
                        { label: 'Close', action: label => {
                            dismiss();
                            callback?.();
                        } 
                    },
                    ]);
                },
            },
            {
                title: 'Dismiss',
                action: dismiss => {
                    dismiss();
                    callback?.();
                }
            }
        ],
    });
}

/**
 * Shows a dialog informing a user that an extension has been updated and optionally providing a link to release notes.
 * 
 * @param api The extension API.
 * @param extInfo The extension update this dialog is referencing.
 * @param message A simple message (or dialog contents) to show to users.
 * @param callback A callback to run *after* the dialog is closed.
 */
export function showUpgradeDialog(api: IExtensionApi, extInfo: ExtensionUpdateInfo, message: string|IDialogContent, callback?: () => void): Promise<IDialogResult> {
    var actions = []
    var title = `${extInfo.name} updated to v${extInfo.newVersion}`
    if (extInfo.releaseNotes) {
        actions.push({label: 'Release Notes', action: () => util.opn(extInfo.releaseNotes)})
    }
    actions.push({label: 'Close', action: () => callback?.()});

    if (typeof message === 'string') {
        return api.showDialog('info', title, {
            text: message as string
        }, actions);
    } else {
        return api.showDialog('info', title, message, actions);
    }
}

/**
 * Shows a simple upgrade notification to users when the migration runs, with an optional (to the user) dialog to provide more details on the update.
 * 
 * @param api The extension API.
 * @param extInfo The extension update this notification is referencing.
 * @param message A simple message (or dialog contents) to show to users in the details dialog.
 * @param callback A callback to run *after* the dialog is closed.
 * @returns A Promise that resolves when the notification or dialog is dismissed.
 */
export function showUpgradeNotification(api: IExtensionApi, extInfo: ExtensionUpdateInfo, message: string|IDialogContent, callback?: () => void): Promise<void> {
    return new Promise((resolve) => {
        return api.sendNotification({
            id: 'beatvortex-migration',
            type: 'success',
            message: api.translate(`${extInfo.name} successfully updated to ${extInfo.newVersion}`),
            noDismiss: true,
            actions: [
                {
                    title: 'More...',
                    action: (dismiss) => {
                        showUpgradeDialog(api, extInfo, message, () => {
                            dismiss();
                            resolve();
                        });
                    }
                },
                {
                    title: 'Dismiss',
                    action: dismiss => {
                      dismiss();
                      resolve();
                    }
                }
            ]
        });
    })
}