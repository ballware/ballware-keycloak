import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "info.ftl" });

const meta = {
    title: "login/info.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const WithRequiredActions: Story = {
    render: () => <KcPageStory kcContext={{ requiredActions: ["CONFIGURE_TOTP", "UPDATE_PASSWORD"] }} />
};

export const WithActionUri: Story = {
    render: () => <KcPageStory kcContext={{ actionUri: "https://example.com/action" }} />
};
