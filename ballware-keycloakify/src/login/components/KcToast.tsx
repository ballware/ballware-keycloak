import { useEffect } from "react";
import notify from "devextreme/ui/notify";
import type { KcContext } from "../KcContext";
import { kcHtmlToText } from "../lib/kcText";

/**
 * Replacement for the FTL theme's $('#toast').dxToast({ displayTime: 20000, visible: true })
 */
export function KcToast(props: { message: KcContext["message"] }) {
    const { message } = props;

    useEffect(() => {
        if (message === undefined) {
            return;
        }

        const text = kcHtmlToText(message.summary);

        if (text === "") {
            return;
        }

        notify({ message: text, type: message.type, displayTime: 20000 });
    }, [message]);

    return null;
}
