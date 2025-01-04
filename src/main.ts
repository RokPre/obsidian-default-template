import { Extension, Prec } from "@codemirror/state";
import { Plugin, Notice, loadMathJax, addIcon } from "obsidian";
import { DEFAULT_SETTINGS } from "./settings/settings";
import { DefaultTemplateSettingTab } from "./settings/settings_tab";
import { EditorView, tooltips } from "@codemirror/view";

export default class DefaultTemplatePlugin extends Plugin {
	settings: DefaultTemplatePluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DefaultTemplateSettingTab(this.app, this));

		this.checkForNewFiles();
	}

	async saveSettings(didFileLocationChange = false) {
		await this.saveData(this.settings);
	}

	async loadSettings() {
		let data = await this.loadData();

		// Migrate settings from v1.8.0 - v1.8.4
		const shouldMigrateSettings = data ? "basicSettings" in data : false;

		// @ts-ignore
		function migrateSettings(oldSettings) {
			return {
				...oldSettings.basicSettings,
				...oldSettings.rawSettings,
				snippets: oldSettings.snippets,
			};
		}

		if (shouldMigrateSettings) {
			data = migrateSettings(data);
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

		if (shouldMigrateSettings) {
			this.saveSettings();
		}

		if (this.settings.loadSnippetsFromFile || this.settings.loadSnippetVariablesFromFile) {
			const tempSnippetVariables = await this.getSettingsSnippetVariables();
			const tempSnippets = await this.getSettingsSnippets(tempSnippetVariables);


			// Use onLayoutReady so that we don't try to read the snippets file too early
			this.app.workspace.onLayoutReady(() => {
			});
		}
	}

	async checkForNewFiles() {
		const sessionTime = Date.now();
		let templaterPlugin = this.app.plugins.plugins["templater-obsidian"];

        // Register event to handle new file creation
        this.registerEvent(this.app.vault.on('create', async (file: TFile) => {
			templaterPlugin = this.app.plugins.plugins["templater-obsidian"];
            const fileStats = await this.app.vault.adapter.stat(file.path);
            const fileCreationTime = fileStats.ctime;
            const newFile = sessionTime < fileCreationTime;
            const ismd = file.extension === 'md';

            if (ismd && newFile) {
                // console.log('New file created', file.path);

                const templatePath = this.settings.templatePath;
                const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

				// console.log("path: ", templatePath);
				// console.log("file: ", templateFile);

                if (!templateFile) {
                    console.error('Template file not found');
                    new Notice("Template file not found");
                    return;
                }

                try {
                    const templateContent = await this.app.vault.read(templateFile);
                    await this.app.vault.modify(file, templateContent);
					if (this.settings.useTemplater){
						await templaterPlugin.templater.overwrite_file_commands(file);
					}
                }

				catch (error) {
					if (error.message.includes("Cannot read properties of undefined")){
						console.error('Templater plugin not running', error);
						new Notice("Templater plugin not running");
					}
					else {
						console.error('Error applying template', error);
						new Notice("Error applying template");
					}
                }
            }
        }));
	}
}
