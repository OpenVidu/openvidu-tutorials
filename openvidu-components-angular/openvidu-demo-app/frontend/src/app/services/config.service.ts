import { Injectable } from '@angular/core';
import { HttpService } from '@app/services/http.service';
import { ServerConfigurationResponse } from '@models/server.model';

@Injectable({
	providedIn: 'root'
})
export class ConfigService {
	private config: ServerConfigurationResponse | undefined;
	private initialization: Promise<void> | undefined;

	constructor(private httpService: HttpService) {}

	async initialize(): Promise<void> {
		if (!this.initialization) {
			this.initialization = this.loadConfig();
		}

		return this.initialization;
	}

	private async loadConfig(): Promise<void> {
		try {
			this.config = await this.httpService.getConfig();
		} catch (error) {
			console.error('Failed to load configuration:', error);
			// Handle the error as needed, e.g., set default config or notify the user
			this.config = { isPrivateAccess: true }; // Default value in case of error
		}
	}

	isPrivateAccess(): boolean {
		// Ensure configuration is loaded before accessing it
		if (!this.initialization) {
			throw new Error('ConfigService not initialized. Service initialize() before accessing config.');
		}

		return this.config?.isPrivateAccess ?? true;
	}
}
