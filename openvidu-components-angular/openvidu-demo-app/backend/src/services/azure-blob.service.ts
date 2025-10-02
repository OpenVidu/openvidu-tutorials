import {
	BlobServiceClient,
	ContainerClient,
	BlockBlobClient,
	ContainerListBlobsOptions,
	BlobItem,
	BlockBlobUploadResponse
} from '@azure/storage-blob';
import { DEMO_APP_AZURE_ACCOUNT_NAME, DEMO_APP_AZURE_ACCOUNT_KEY, DEMO_APP_AZURE_CONTAINER_NAME } from '../config.js';
import { Readable } from 'stream';
import { errorAzureBlobNotAvailable, internalError } from '../models/error.model.js';
import { LoggerService } from './logger.service.js';

export class AzureBlobService {
	private blobServiceClient: BlobServiceClient;
	private containerClient: ContainerClient;
	private logger = LoggerService.getInstance();
	protected static instance: AzureBlobService;

	private constructor() {
		if (!DEMO_APP_AZURE_ACCOUNT_NAME || !DEMO_APP_AZURE_ACCOUNT_KEY || !DEMO_APP_AZURE_CONTAINER_NAME) {
			throw new Error('Azure Blob Storage configuration is incomplete');
		}

		const AZURE_STORAGE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${DEMO_APP_AZURE_ACCOUNT_NAME};AccountKey=${DEMO_APP_AZURE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
		this.blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
		this.containerClient = this.blobServiceClient.getContainerClient(DEMO_APP_AZURE_CONTAINER_NAME);
	}

	static getInstance() {
		if (!AzureBlobService.instance) {
			AzureBlobService.instance = new AzureBlobService();
		}

		return AzureBlobService.instance;
	}

	/**
	 * Checks if a file exists in the recordings container.
	 *
	 * @param blobName - The name of the blob to be checked.
	 * @returns A boolean indicating whether the file exists or not.
	 */
	async exists(blobName: string): Promise<boolean> {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);
			return await blobClient.exists();
		} catch (err: any) {
			this.logger.error(`Error checking blob existence: ${err}`);
			return false;
		}
	}

	/** Upload JSON as blob */
	async uploadObject(blobName: string, body: any): Promise<BlockBlobUploadResponse> {
		try {
			const blockBlob: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
			const data = JSON.stringify(body);
			return await blockBlob.upload(data, Buffer.byteLength(data));
		} catch (err: any) {
			this.logger.error(`Error uploading blob: ${err}`);

			if (err.code === 'ECONNREFUSED') {
				throw errorAzureBlobNotAvailable(err);
			}

			throw internalError(err);
		}
	}

	/**
	 * Deletes a blob object from the recordings container.
	 *
	 * @param blobName - The name of the object to delete.
	 * @returns A promise that resolves to the result of the delete operation.
	 * @throws Throws an error if there was an error deleting the object or if the blob doesnt exists.
	 */
	async deleteObject(blobName: string): Promise<void> {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);
			const exists = await blobClient.exists();

			if (!exists) {
				throw new Error(`Blob '${blobName}' no existe`);
			}

			await blobClient.delete();
		} catch (err: any) {
			this.logger.error(`Error deleting blob: ${err}`);
			throw internalError(err);
		}
	}

	/**
	 * Lists all objects in the recording container with optional search pattern filtering.
	 *
	 * @param {string} [directory=''] - The subbucket within the main bucket to list objects from.
	 * @param {string} [searchPattern=''] - A regex pattern to filter the objects by their keys.
	 * @returns {Promise<BlobItem[]>} - A promise that resolves to the output of the ListObjectsV2Command.
	 * @throws {Error} - Throws an error if there is an issue listing the objects.
	 */
	async listObjects(directory = '', searchPattern = ''): Promise<BlobItem[]> {
		try {
			const prefix = directory ? `${directory}/` : '';
			const options: ContainerListBlobsOptions = { prefix };
			const iter = this.containerClient.listBlobsFlat(options);
			const allItems: BlobItem[] = [];
			let i = 1;

			for await (const item of iter) {
				if (!searchPattern || new RegExp(searchPattern).test(item.name!)) {
					this.logger.verbose(`Blob ${i++}: ${item.name}`);
					allItems.push(item);
				}
			}

			return allItems;
		} catch (err: any) {
			this.logger.error(`Error listing blobs: ${err}`);

			if (err.code === 'ECONNREFUSED') {
				throw errorAzureBlobNotAvailable(err);
			}

			throw internalError(err);
		}
	}

	async getObjectAsJson(blobName: string): Promise<any | undefined> {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);
			const exists = await blobClient.exists();

			if (!exists) {
				this.logger.warn(`Blob '${blobName}' no existe`);
				return undefined;
			}

			const downloadResp = await blobClient.download();
			const downloaded = await this.streamToString(downloadResp.readableStreamBody!);
			return JSON.parse(downloaded);
		} catch (err: any) {
			this.logger.error(`Error getting blob JSON: ${err}`);

			if (err.code === 'ECONNREFUSED') {
				throw errorAzureBlobNotAvailable(err);
			}

			throw internalError(err);
		}
	}

	async getObjectAsStream(blobName: string, range?: { start: number; end?: number }): Promise<Readable> {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);

			const offset = range ? range.start : 0;
			const count = range && range.end ? range.end - range.start + 1 : undefined;

			const downloadResp = await blobClient.download(offset, count);

			if (!downloadResp.readableStreamBody) {
				throw new Error('El blob no contiene datos');
			}

			return downloadResp.readableStreamBody as Readable;
		} catch (err: any) {
			this.logger.error(`Error streaming blob: ${err}`);

			if (err.code === 'ECONNREFUSED') {
				throw errorAzureBlobNotAvailable(err);
			}

			throw internalError(err);
		}
	}

	/**
	 * Gets the properties (headers/metadata) of a blob object.
	 *
	 * @param blobName - The name of the blob.
	 * @returns The properties of the blob.
	 */
	async getHeaderObject(blobName: string): Promise<Record<string, any>> {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);
			const properties = await blobClient.getProperties();
			// Return only headers/metadata relevant info
			return {
				contentType: properties.contentType,
				contentLength: properties.contentLength,
				lastModified: properties.lastModified,
				etag: properties.etag,
				metadata: properties.metadata
			};
		} catch (error: any) {
			this.logger.error(`Error getting header object from Azure Blob in ${blobName}: ${error}`);
			throw internalError(error);
		}
	}

	async getProperties(blobName: string) {
		try {
			const blobClient = this.containerClient.getBlobClient(blobName);
			return await blobClient.getProperties();
		} catch (err: any) {
			this.logger.error(`Error getting blob properties: ${err}`);
			throw internalError(err);
		}
	}

	private async streamToString(readable: NodeJS.ReadableStream): Promise<string> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			readable.on('data', (data) => chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data)));
			readable.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
			readable.on('error', reject);
		});
	}
}
