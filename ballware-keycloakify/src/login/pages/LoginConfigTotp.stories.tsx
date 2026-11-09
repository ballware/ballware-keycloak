import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-config-totp.ftl" });

const meta = {
    title: "login/login-config-totp.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const ManualMode: Story = {
    render: () => <KcPageStory kcContext={{ mode: "manual" }} />
};

export const AsAppInitiatedAction: Story = {
    render: () => <KcPageStory kcContext={{ isAppInitiatedAction: true }} />
};

export const WithInvalidTotp: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("totp"),
                    getFirstError: () => "One-time code from your authenticator is not valid.",
                    get: () => "One-time code from your authenticator is not valid."
                }
            }}
        />
    )
};
