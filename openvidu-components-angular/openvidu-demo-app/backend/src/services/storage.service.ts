import { IStorageService } from './IStorage.service.js';
import { S3Service } from './s3.service.js';
import { AzureBlobWrapper } from './azure-blob-wrapper.service.js';
import { DEMO_APP_STORAGE_PROVIDER } from '../config.js';

/**
 * Factory to obtain the storage implementation according to the environment variable.
 * Expected variable: STORAGE_PROVIDER = 's3' | 'azure'
 */
export class StorageServiceFactory {
	private static instance: IStorageService;

	/**
	 * Returns the singleton instance of IStorageService according to STORAGE_PROVIDER.
	 */
	static getInstance(): IStorageService {
		if (!this.instance) {
			const provider = DEMO_APP_STORAGE_PROVIDER.toLowerCase();

			switch (provider) {
				case 'azure':
					this.instance = AzureBlobWrapper.getInstance();
					break;
				case 's3':
				default:
					this.instance = S3Service.getInstance();
					break;
			}
		}

		return this.instance;
	}
}
