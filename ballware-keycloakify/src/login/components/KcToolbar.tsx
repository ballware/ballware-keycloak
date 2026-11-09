import DxToolbar, { Item as DxItem } from "devextreme-react/toolbar";
import DxDropDownButton from "devextreme-react/drop-down-button";
import type { ItemClickEvent } from "devextreme/ui/drop_down_button";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcHtmlToText } from "../lib/kcText";

type Locale = { url: string; label: string; languageTag: string };

export function KcToolbar(props: { kcContext: KcContext; i18n: I18n }) {
    const { kcContext, i18n } = props;

    const { realm, locale } = kcContext;

    const { msgStr } = i18n;

    const title = kcHtmlToText(msgStr("loginTitleHtml", realm.displayNameHtml || realm.name));

    const locales: Locale[] = locale?.supported ?? [];

    const currentLocaleLabel =
        locales.find(({ languageTag }) => languageTag === locale?.currentLanguageTag)?.label ?? locale?.currentLanguageTag ?? "";

    return (
        <div id="appbar">
            <DxToolbar>
                <DxItem location="before" locateInMenu="never" text={title} />
                {realm.internationalizationEnabled && locales.length > 1 && (
                    <DxItem
                        location="after"
                        locateInMenu="never"
                        render={() => (
                            <DxDropDownButton
                                stylingMode="contained"
                                text={currentLocaleLabel}
                                items={locales}
                                displayExpr="label"
                                onItemClick={(event: ItemClickEvent) => {
                                    window.location.href = (event.itemData as Locale).url;
                                }}
                            />
                        )}
                    />
                )}
            </DxToolbar>
        </div>
    );
}
