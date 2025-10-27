import { EmbedBuilder } from "discord.js";

export class HelpEmbedBuilder {
    constructor() {
        this.title = null;
        this.description = null;
        this.example = null;
        this.usage = null;
        this.aliases = [];
        this.color = "#00BFFF";
    }

    withName(name) {
        this.title = name;
        return this;
    }

    withDescription(description) {
        this.description = description;
        return this;
    }

    withExampleUsage(example) {
        this.example = example;
        return this;
    }

    withAliase(aliases) {
        if (Array.isArray(aliases)) {
            this.aliases = aliases;
        }
        return this;
    }

    withUsage(usage) {
        this.usage = usage;
        return this;
    }

    build() {
        const embed = new EmbedBuilder()
            .setTitle(this.title || "Help")
            .setColor(this.color)
            .setFooter({
                text: "Anything in <> is optional, anything in [] is customizable",
            });

        if (this.description) {
            embed.setDescription(this.description);
        }

        // Always show aliases field
        const aliasText =
            this.aliases.length > 0
                ? this.aliases.map((a) => `\`${a}\``).join(", ")
                : "`None`";
        embed.addFields({
            name: "Aliases",
            value: aliasText,
            inline: false,
        });

        // Conditionally show usage field
        if (this.usage) {
            embed.addFields({
                name: "Usage",
                value: this.usage,
                inline: false,
            });
        }

        // Conditionally show example field
        if (this.example) {
            embed.addFields({
                name: "Example",
                value: `\`\`\`${this.example}\`\`\``,
                inline: false,
            });
        }

        return embed;
    }
}
