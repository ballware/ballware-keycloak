import DxButton from "devextreme-react/button";

type I18nLike = {
    msgStr: (key: "doCancel") => string;
};

/**
 * Mirrors the FTL theme: a visible DevExtreme cancel button that triggers a
 * hidden native submit button carrying name="cancel-aia" value="true".
 */
export function CancelAiaButton(props: { i18n: I18nLike; buttonId: string }) {
    const { i18n, buttonId } = props;

    const nativeButtonId = `${buttonId}-native`;

    return (
        <>
            <button id={nativeButtonId} type="submit" name="cancel-aia" value="true" style={{ display: "none" }} />
            <DxButton
                elementAttr={{ id: buttonId }}
                text={i18n.msgStr("doCancel")}
                stylingMode="text"
                onClick={() => {
                    const native = document.getElementById(nativeButtonId);

                    if (native instanceof HTMLButtonElement) {
                        native.form?.requestSubmit(native);
                    }
                }}
            />
        </>
    );
}
