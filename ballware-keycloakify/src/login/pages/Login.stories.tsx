import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login.ftl" });

const meta = {
    title: "login/login.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const WithInvalidCredential: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                login: { username: "toto" },
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("username") || fields.includes("password"),
                    getFirstError: () => "Invalid username or password.",
                    get: () => "Invalid username or password."
                }
            }}
        />
    )
};

export const WithUsernameHidden: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                usernameHidden: true,
                auth: { showUsername: true, showResetCredentials: false, attemptedUsername: "toto" },
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("username") || fields.includes("password"),
                    getFirstError: () => "Invalid username or password.",
                    get: () => "Invalid username or password."
                }
            }}
        />
    )
};

export const WithMessage: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                message: { type: "warning", summary: "You are logged in from another browser." }
            }}
        />
    )
};

export const WithRegistration: Story = {
    render: () => <KcPageStory kcContext={{ realm: { registrationAllowed: true } }} />
};

export const WithoutDevExtremeLicense: Story = {
    render: () => <KcPageStory kcContext={{ properties: { DEVEXTREME_LICENSE: "" } }} />
};
