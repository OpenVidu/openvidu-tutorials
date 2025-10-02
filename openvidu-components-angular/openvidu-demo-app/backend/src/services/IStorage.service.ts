import {
    _Object,
    DeleteObjectCommandOutput,
    HeadObjectCommandOutput,
    ListObjectsV2CommandOutput,
    PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface IStorageService {
    uploadObject(name: string, body: any, bucket?: string): Promise<PutObjectCommandOutput>;
    deleteObject(name: string, bucket?: string): Promise<DeleteObjectCommandOutput>;
    listObjects(directory: string, searchPattern: string, bucket?: string, maxObjects?: number): Promise<ListObjectsV2CommandOutput>;
    getObjectAsJson(name: string, bucket?: string): Promise<Object | undefined>;
    getObjectAsStream(name: string, bucket?: string, range?: { start: number; end: number }): Promise<Readable>;
    getHeaderObject(name: string, bucket?: string): Promise<HeadObjectCommandOutput>;
}