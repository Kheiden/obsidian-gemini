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
	
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Obsidian Gemini', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Hello World');
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

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
		

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-configuration-simple',
			name: 'Open Configuration (simple)',
			callback: () => {
				new Configuration(this.app).open();
			}
		});

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

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new Configuration(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
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

class Configuration extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
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
