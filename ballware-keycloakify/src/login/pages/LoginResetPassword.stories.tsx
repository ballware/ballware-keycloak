import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-reset-password.ftl" });

const meta = {
    title: "login/login-reset-password.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const WithUnknownUsername: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                auth: { attemptedUsername: "does-not-exist" },
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("username"),
                    getFirstError: () => "No user with this username found.",
                    get: () => "No user with this username found."
                }
            }}
        />
    )
};
