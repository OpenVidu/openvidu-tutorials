import {
	DeleteObjectCommand,
	DeleteObjectCommandOutput,
	GetObjectCommand,
	GetObjectCommandOutput,
	HeadObjectCommand,
	HeadObjectCommandOutput,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
	S3ClientConfig
} from '@aws-sdk/client-s3';

import {
	S3_ACCESS_KEY,
	AWS_REGION,
	S3_BUCKET,
	S3_SERVICE_ENDPOINT,
	S3_SECRET_KEY,
	S3_WITH_PATH_STYLE_ACCESS
} from '../config.js';
import { errorS3NotAvailable, internalError } from '../models/error.model.js';
import { Readable } from 'stream';
import { LoggerService } from './logger.service.js';

export class S3Service {
	private s3: S3Client;
	private logger = LoggerService.getInstance();
	protected static instance: S3Service;

	constructor() {
		const config: S3ClientConfig = {
			region: AWS_REGION,
			credentials: {
				accessKeyId: S3_ACCESS_KEY,
				secretAccessKey: S3_SECRET_KEY
			},
			endpoint: S3_SERVICE_ENDPOINT,
			forcePathStyle: S3_WITH_PATH_STYLE_ACCESS === 'true'
		};

		this.s3 = new S3Client(config);
	}

	static getInstance() {
		if (!S3Service.instance) {
			S3Service.instance = new S3Service();
		}

		return S3Service.instance;
	}

	/**
	 * Checks if a file exists in the specified S3 bucket.
	 *
	 * @param path - The path of the file to check.
	 * @param AWS_S3_BUCKET - The name of the S3 bucket.
	 * @returns A boolean indicating whether the file exists or not.
	 */
	async exists(path: string, bucket: string = S3_BUCKET) {
		try {
			await this.getHeaderObject(path, bucket);
			return true;
		} catch (error) {
			return false;
		}
	}

	async uploadObject(name: string, body: any, bucket: string = S3_BUCKET): Promise<PutObjectCommandOutput> {
		try {
			const command = new PutObjectCommand({
				Bucket: bucket,
				Key: name,
				Body: JSON.stringify(body)
			});
			return await this.run(command);
		} catch (error: any) {
			this.logger.error(`Error putting object in S3: ${error}`);

			if (error.code === 'ECONNREFUSED') {
				throw errorS3NotAvailable(error);
			}

			throw internalError(error);
		}
	}

	/**
	 * Deletes an object from an S3 bucket.
	 *
	 * @param name - The name of the object to delete.
	 * @param bucket - The name of the S3 bucket (optional, defaults to S3_BUCKET).
	 * @returns A promise that resolves to the result of the delete operation.
	 * @throws Throws an error if there was an error deleting the object.
	 */
	async deleteObject(name: string, bucket: string = S3_BUCKET): Promise<DeleteObjectCommandOutput> {
		try {
			this.logger.info(`Deleting object in S3: ${name}`);
			const command = new DeleteObjectCommand({ Bucket: bucket, Key: name });
			return await this.run(command);
		} catch (error) {
			this.logger.error(`Error deleting object in S3: ${error}`);
			throw internalError(error);
		}
	}

	/**
	 * Lists objects in an S3 bucket.
	 *
	 * @param subbucket - The subbucket within the bucket to list objects from.
	 * @param searchPattern - The search pattern to filter the objects by.
	 * @param bucket - The name of the S3 bucket.
	 * @param maxObjects - The maximum number of objects to retrieve.
	 * @returns A promise that resolves to the list of objects.
	 * @throws Throws an error if there was an error listing the objects.
	 */
	async listObjects(
		subbucket = '',
		searchPattern = '',
		bucket: string = S3_BUCKET,
		maxObjects = 20,
		continuationToken?: string
	): Promise<ListObjectsV2CommandOutput> {
		const prefix = subbucket ? `${subbucket}/` : '';
		const command = new ListObjectsV2Command({
			Bucket: bucket,
			Prefix: prefix,
			MaxKeys: maxObjects,
			ContinuationToken: continuationToken
		});

		try {
			const response: ListObjectsV2CommandOutput = await this.run(command);

			if (searchPattern) {
				const regex = new RegExp(searchPattern);
				response.Contents = response.Contents?.filter((object) => {
					return object.Key && regex.test(object.Key);
				});
			}

			return response;
		} catch (error) {
			this.logger.error(`Error listing objects: ${error}`);

			if ((error as any).code === 'ECONNREFUSED') {
				throw errorS3NotAvailable(error);
			}

			throw internalError(error);
		}
	}

	async getObjectAsJson(name: string, bucket: string = S3_BUCKET): Promise<Object | undefined> {
		try {
			const obj = await this.getObject(name, bucket);
			const str = await obj.Body?.transformToString();
			return JSON.parse(str as string);
		} catch (error: any) {
			if (error.name === 'NoSuchKey') {
				this.logger.warn(`Object '${name}' does not exist in S3`);
				return undefined;
			}

			if (error.code === 'ECONNREFUSED') {
				throw errorS3NotAvailable(error);
			}

			this.logger.error(`Error getting object from S3. Maybe it has been deleted: ${error}`);
			throw internalError(error);
		}
	}

	async getObjectAsStream(name: string, bucket: string = S3_BUCKET, range?: { start: number; end: number }) {
		try {
			const obj = await this.getObject(name, bucket, range);

			if (obj.Body) {
				return obj.Body as Readable;
			} else {
				throw new Error('Empty body response');
			}
		} catch (error: any) {
			this.logger.error(`Error getting object from S3: ${error}`);

			if (error.code === 'ECONNREFUSED') {
				throw errorS3NotAvailable(error);
			}

			throw internalError(error);
		}
	}

	async getHeaderObject(name: string, bucket: string = S3_BUCKET): Promise<HeadObjectCommandOutput> {
		try {
			const headParams: HeadObjectCommand = new HeadObjectCommand({
				Bucket: bucket,
				Key: name
			});
			return await this.run(headParams);
		} catch (error) {
			throw internalError(error);
		}
	}

	quit() {
		this.s3.destroy();
	}

	private async getObject(
		name: string,
		bucket: string = S3_BUCKET,
		range?: { start: number; end: number }
	): Promise<GetObjectCommandOutput> {
		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: name,
			Range: range ? `bytes=${range.start}-${range.end}` : undefined
		});

		return await this.run(command);
	}

	private async run(command: any) {
		return this.s3.send(command);
	}
}
