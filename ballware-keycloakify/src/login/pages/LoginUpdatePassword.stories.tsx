import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-update-password.ftl" });

const meta = {
    title: "login/login-update-password.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const AsAppInitiatedAction: Story = {
    render: () => <KcPageStory kcContext={{ isAppInitiatedAction: true }} />
};

export const WithPasswordError: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("password") || fields.includes("password-confirm"),
                    getFirstError: () => "Password is too short: must be at least 8 characters.",
                    get: () => "Password is too short: must be at least 8 characters."
                }
            }}
        />
    )
};
