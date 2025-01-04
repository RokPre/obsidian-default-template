import { EditorState, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { App, ButtonComponent, ExtraButtonComponent, Modal, PluginSettingTab, Setting, debounce } from "obsidian";
import DefaultTemplatePlugin from "../main";
import { DEFAULT_SETTINGS } from "./settings";
import { FileSuggest } from "./ui/file_suggest";


export class DefaultTemplateSettingTab extends PluginSettingTab {
	plugin: DefaultTemplatePlugin;

	constructor(app: App, plugin: DefaultTemplatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.displaySnippetSettings();
		this.displayTemplaterToggle();
	}

	private displaySnippetSettings() {
		const containerEl = this.containerEl;

		const templateFileLoc = new Setting(containerEl)
			.setName("Template location")
			.setDesc("The location of your template");

		let inputEl;
		templateFileLoc.addSearch(component => {
			component
				.setPlaceholder("File path")
				.setValue(this.plugin.settings.templatePath)
				.onChange(debounce(async (value) => {
					this.plugin.settings.templatePath = value;
					await this.plugin.saveSettings(true);
				}, 500, true));

			inputEl = component.inputEl;
			inputEl.addClass("default-template-location-input-el");
		});

		this.snippetsFileLocEl = templateFileLoc.settingEl;
		new FileSuggest(this.app, inputEl);
	}

	private displayTemplaterToggle() {
		const containerEl = this.containerEl;

		const templaterToggle = new Setting(containerEl)
			.setName("Use Templater")
			.setDesc("Use Templater to apply the template")
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.useTemplater)
					.onChange(async (value) => {
						this.plugin.settings.useTemplater = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
