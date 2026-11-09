import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-otp.ftl" });

const meta = {
    title: "login/login-otp.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const WithTwoCredentials: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                otpLogin: {
                    selectedCredentialId: "2",
                    userOtpCredentials: [
                        { id: "1", userLabel: "Google Authenticator" },
                        { id: "2", userLabel: "Phone" }
                    ]
                }
            }}
        />
    )
};

export const WithInvalidOtp: Story = {
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
