import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "register.ftl" });

const meta = {
    title: "login/register.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deutsch: Story = {
    render: () => <KcPageStory kcContext={{ locale: { currentLanguageTag: "de" } }} />
};

export const WithValidationError: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                profile: {
                    attributesByName: {
                        username: {
                            name: "username",
                            displayName: "Username",
                            required: true,
                            readOnly: false,
                            validators: { length: { min: 8, "ignore.empty.value": true } },
                            annotations: {}
                        }
                    }
                },
                messagesPerField: {
                    existsError: (...fields: string[]) => fields.includes("username"),
                    getFirstError: () => "Length must be at least 8",
                    get: () => "Length must be at least 8"
                }
            }}
        />
    )
};
