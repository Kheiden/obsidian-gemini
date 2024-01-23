import { App, DataAdapter , Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';
import axios, { AxiosRequestConfig, AxiosPromise } from 'axios';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	geminiApiKey: string; // Add geminiApiKey property to the settings interface
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	geminiApiKey: '' // Set default value for geminiApiKey
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Gemini getting ready...');

		// Check if a value has been set for the Setting 'gemini-api-key'
		if (!this.settings.geminiApiKey) {
			new Notice('Please set the Gemini API key in the plugin settings.');
		} else {
			// Set the status bar item to a new value
			statusBarItemEl.setText('Gemini ready!');
		}
		
		this.addCommand({
			id: 'generate-content',
			name: 'Generate Content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.settings.geminiApiKey}`;
				class GeminiAPI{
					async generateContent() {
						const data = {
							contents: [
								{
									parts: [
										{
											text: editor.getSelection()
										}
									]
								}
							]
						};
		
						try {
							const response = await axios.post(url, data);
							
							// Handle the response here
							editor.replaceSelection(
								editor.getSelection() + '\n\n' +
								response.data.candidates[0].content.parts[0].text);
							// Vault.read("test.md", response.data);
						} catch (error) {
							// Handle the error here
							new Notice(error);
						}
					}
				}
				const geminiAPI = new GeminiAPI();
				geminiAPI.generateContent();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('gemini-api-key')
			.setDesc('Gemini API key from http://ai.google.dev/')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
