/* eslint-disable import/no-anonymous-default-export */
/**
 * Advanced FormData utility with comprehensive data type handling
 * Supports nested objects, arrays, files, dates, and complex data structures
 */

export interface FormDataOptions {
    /** Whether to parse nested objects (default: true) */
    parseNestedObjects?: boolean;
    /** Whether to parse arrays (default: true) */
    parseArrays?: boolean;
    /** Custom array notation: 'bracket' | 'indexed' | 'comma' (default: 'indexed') */
    arrayNotation?: 'bracket' | 'indexed' | 'comma';
    /** Maximum nesting depth to prevent infinite recursion (default: 10) */
    maxDepth?: number;
    /** Whether to include null values (default: false) */
    includeNullValues?: boolean;
    /** Whether to include undefined values (default: false) */
    includeUndefinedValues?: boolean;
    /** Custom key transformer function */
    keyTransformer?: (key: string) => string;
    /** Custom value transformer function */
    valueTransformer?: (value: any, key: string) => any;
    /** Date format: 'iso' | 'timestamp' | 'custom' (default: 'iso') */
    dateFormat?: 'iso' | 'timestamp' | 'custom';
    /** Custom date formatter function (when dateFormat is 'custom') */
    customDateFormatter?: (date: Date) => string;
    /** Whether to serialize complex objects as JSON strings (default: false) */
    serializeComplexObjects?: boolean;
    /** Array of keys to exclude from FormData */
    excludeKeys?: string[];
    /** Whether to flatten single-item arrays (default: false) */
    flattenSingleArrays?: boolean;
    /** Prefix for all keys */
    keyPrefix?: string;
    /** Whether to preserve empty arrays (default: true) */
    preserveEmptyArrays?: boolean;
    /** Custom file name generator */
    fileNameGenerator?: (file: File, key: string, index?: number) => string;
    /** Whether to validate files before appending */
    validateFiles?: boolean;
    /** Maximum file size in bytes (when validateFiles is true) */
    maxFileSize?: number;
    /** Allowed file types (when validateFiles is true) */
    allowedFileTypes?: string[];
    /** Whether to compress large objects */
    compressLargeObjects?: boolean;
    /** Size threshold for compression in characters */
    compressionThreshold?: number;
}

export interface FormDataResult {
    formData: FormData;
    metadata: {
        totalKeys: number;
        fileCount: number;
        arrayCount: number;
        objectCount: number;
        excludedKeys: string[];
        errors: Array<{ key: string; error: string; value: any }>;
        warnings: Array<{ key: string; warning: string; value: any }>;
    };
}

export class AdvancedFormDataBuilder {
    private options: Required<FormDataOptions>;
    private metadata = {
        totalKeys: 0,
        fileCount: 0,
        arrayCount: 0,
        objectCount: 0,
        excludedKeys: [] as string[],
        errors: [] as Array<{ key: string; error: string; value: any }>,
        warnings: [] as Array<{ key: string; warning: string; value: any }>
    };

    constructor(options: FormDataOptions = {}) {
        this.options = {
            parseNestedObjects: true,
            parseArrays: true,
            arrayNotation: 'indexed',
            maxDepth: 10,
            includeNullValues: false,
            includeUndefinedValues: false,
            keyTransformer: (key: string) => key,
            valueTransformer: (value: any) => value,
            dateFormat: 'iso',
            customDateFormatter: (date: Date) => date.toISOString(),
            serializeComplexObjects: false,
            excludeKeys: [],
            flattenSingleArrays: false,
            keyPrefix: '',
            preserveEmptyArrays: true,
            fileNameGenerator: (file: File) => file.name,
            validateFiles: false,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            allowedFileTypes: [],
            compressLargeObjects: false,
            compressionThreshold: 10000,
            ...options
        };
    }

    /**
     * Convert any data structure to FormData
     */
    public build(data: any): FormDataResult {
        const formData = new FormData();
        this.resetMetadata();

        if (data === null || data === undefined) {
            return { formData, metadata: this.metadata };
        }

        try {
            this.processValue('', data, formData, 0);
        } catch (error) {
            this.addError('root', `Failed to process data: ${error}`, data);
        }

        return { formData, metadata: this.metadata };
    }

    private resetMetadata(): void {
        this.metadata = {
            totalKeys: 0,
            fileCount: 0,
            arrayCount: 0,
            objectCount: 0,
            excludedKeys: [],
            errors: [],
            warnings: []
        };
    }

    private processValue(
        key: string,
        value: any,
        formData: FormData,
        depth: number
    ): void {
        // Check depth limit
        if (depth > this.options.maxDepth) {
            this.addWarning(key, `Maximum depth (${this.options.maxDepth}) exceeded`, value);
            return;
        }

        // Check excluded keys
        if (this.options.excludeKeys.includes(key)) {
            this.metadata.excludedKeys.push(key);
            return;
        }

        // Transform value
        try {
            value = this.options.valueTransformer(value, key);
        } catch (error) {
            this.addError(key, `Value transformer failed: ${error}`, value);
            return;
        }

        // Handle different value types
        if (value === null) {
            if (this.options.includeNullValues) {
                this.appendToFormData(formData, key, 'null');
            }
            return;
        }

        if (value === undefined) {
            if (this.options.includeUndefinedValues) {
                this.appendToFormData(formData, key, 'undefined');
            }
            return;
        }

        if (value instanceof File) {
            this.processFile(formData, key, value);
        } else if (value instanceof FileList) {
            this.processFileList(formData, key, value);
        } else if (value instanceof Blob) {
            this.processBlob(formData, key, value);
        } else if (value instanceof Date) {
            this.processDate(formData, key, value);
        } else if (Array.isArray(value)) {
            if (this.options.parseArrays) {
                this.processArray(formData, key, value, depth);
            } else {
                this.appendToFormData(formData, key, JSON.stringify(value));
            }
        } else if (this.isPlainObject(value)) {
            if (this.options.parseNestedObjects) {
                this.processObject(formData, key, value, depth);
            } else if (this.options.serializeComplexObjects) {
                this.appendToFormData(formData, key, this.serializeObject(value));
            } else {
                this.appendToFormData(formData, key, '[object Object]');
            }
        } else if (typeof value === 'function') {
            this.addWarning(key, 'Function values are not supported', value);
        } else if (typeof value === 'symbol') {
            this.appendToFormData(formData, key, value.toString());
        } else if (typeof value === 'bigint') {
            this.appendToFormData(formData, key, value.toString());
        } else if (typeof value === 'boolean') {
            this.appendToFormData(formData, key, value.toString());
        } else if (typeof value === 'number') {
            if (isNaN(value)) {
                this.appendToFormData(formData, key, 'NaN');
            } else if (!isFinite(value)) {
                this.appendToFormData(formData, key, value > 0 ? 'Infinity' : '-Infinity');
            } else {
                this.appendToFormData(formData, key, value.toString());
            }
        } else {
            // Convert to string
            this.appendToFormData(formData, key, String(value));
        }
    }

    private processFile(formData: FormData, key: string, file: File): void {
        if (this.options.validateFiles) {
            const validation = this.validateFile(file, key);
            if (!validation.isValid) {
                this.addError(key, validation.error!, file);
                return;
            }
        }

        const fileName = this.options.fileNameGenerator(file, key);
        this.appendToFormData(formData, key, file, fileName);
        this.metadata.fileCount++;
    }

    private processFileList(formData: FormData, key: string, fileList: FileList): void {
        const files = Array.from(fileList);
        files.forEach((file, index) => {
            const fileKey = this.formatArrayKey(key, index);
            this.processFile(formData, fileKey, file);
        });
    }

    private processBlob(formData: FormData, key: string, blob: Blob): void {
        const fileName = `blob_${Date.now()}`;
        this.appendToFormData(formData, key, blob, fileName);
    }

    private processDate(formData: FormData, key: string, date: Date): void {
        let dateString: string;

        switch (this.options.dateFormat) {
            case 'timestamp':
                dateString = date.getTime().toString();
                break;
            case 'custom':
                dateString = this.options.customDateFormatter(date);
                break;
            case 'iso':
            default:
                dateString = date.toISOString();
                break;
        }

        this.appendToFormData(formData, key, dateString);
    }

    private processArray(
        formData: FormData,
        key: string,
        array: any[],
        depth: number
    ): void {
        if (array.length === 0 && !this.options.preserveEmptyArrays) {
            return;
        }

        if (array.length === 1 && this.options.flattenSingleArrays) {
            this.processValue(key, array[0], formData, depth + 1);
            return;
        }

        if (this.options.arrayNotation === 'comma' && this.isSimpleArray(array)) {
            this.appendToFormData(formData, key, array.join(','));
            return;
        }

        array.forEach((item, index) => {
            const arrayKey = this.formatArrayKey(key, index);
            this.processValue(arrayKey, item, formData, depth + 1);
        });

        this.metadata.arrayCount++;
    }

    private processObject(
        formData: FormData,
        key: string,
        obj: Record<string, any>,
        depth: number
    ): void {
        const entries = Object.entries(obj);

        if (entries.length === 0) {
            return;
        }

        entries.forEach(([subKey, subValue]) => {
            const objectKey = key ? `${key}[${subKey}]` : subKey;
            this.processValue(objectKey, subValue, formData, depth + 1);
        });

        this.metadata.objectCount++;
    }

    private formatArrayKey(key: string, index: number): string {
        switch (this.options.arrayNotation) {
            case 'bracket':
                return `${key}[]`;
            case 'indexed':
                return `${key}[${index}]`;
            default:
                return `${key}[${index}]`;
        }
    }

    private appendToFormData(
        formData: FormData,
        key: string,
        value: string | Blob | File | any,
        fileName?: string
    ): void {
        const transformedKey = this.options.keyTransformer(
            this.options.keyPrefix + key
        );

        if (fileName && (value instanceof Blob || value instanceof File)) {
            formData.append(transformedKey, value, fileName);
        } else {
            formData.append(transformedKey, value as string | Blob);
        }

        this.metadata.totalKeys++;
    }

    private validateFile(file: File, key: string): { isValid: boolean; error?: string } {
        console.log("key: ", key);
        if (file.size > this.options.maxFileSize) {
            return {
                isValid: false,
                error: `File size (${file.size} bytes) exceeds maximum (${this.options.maxFileSize} bytes)`
            };
        }

        if (this.options.allowedFileTypes.length > 0) {
            const fileType = file.type || '';
            const isAllowed = this.options.allowedFileTypes.some(type =>
                fileType.startsWith(type.replace('*', ''))
            );

            if (!isAllowed) {
                return {
                    isValid: false,
                    error: `File type "${fileType}" is not allowed. Allowed types: ${this.options.allowedFileTypes.join(', ')}`
                };
            }
        }

        return { isValid: true };
    }

    private isPlainObject(value: any): boolean {
        return (
            typeof value === 'object' &&
            value !== null &&
            value.constructor === Object &&
            Object.prototype.toString.call(value) === '[object Object]'
        );
    }

    private isSimpleArray(array: any[]): boolean {
        return array.every(item =>
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
        );
    }

    private serializeObject(obj: any): string {
        try {
            const serialized = JSON.stringify(obj);

            if (this.options.compressLargeObjects &&
                serialized.length > this.options.compressionThreshold) {
                // Simple compression simulation - in practice, you might use a real compression library
                return this.simpleCompress(serialized);
            }

            return serialized;
        } catch (error) {
            console.log("Error: ", error);
            return '[Unserializable Object]';
        }
    }

    private simpleCompress(str: string): string {
        // Placeholder for compression - implement with actual compression library
        return btoa(str); // Base64 encoding as simple "compression"
    }

    private addError(key: string, error: string, value: any): void {
        this.metadata.errors.push({ key, error, value });
    }

    private addWarning(key: string, warning: string, value: any): void {
        this.metadata.warnings.push({ key, warning, value });
    }
}

// Main function with backward compatibility
export const makeFormData = (
    formData: any,
    options?: FormDataOptions | boolean
): FormData => {
    // Handle legacy boolean parameter
    if (typeof options === 'boolean') {
        options = { parseNestedObjects: options };
    }

    const builder = new AdvancedFormDataBuilder(options);
    const result = builder.build(formData);

    // Log errors and warnings in development
    if (process.env.NODE_ENV === 'development') {
        if (result.metadata.errors.length > 0) {
            console.warn('FormData conversion errors:', result.metadata.errors);
        }
        if (result.metadata.warnings.length > 0) {
            console.warn('FormData conversion warnings:', result.metadata.warnings);
        }
    }

    return result.formData;
};

// Advanced function that returns both FormData and metadata
export const makeAdvancedFormData = (
    formData: any,
    options?: FormDataOptions
): FormDataResult => {
    const builder = new AdvancedFormDataBuilder(options);
    return builder.build(formData);
};

// Utility functions
export const createFormDataBuilder = (options?: FormDataOptions) => {
    return new AdvancedFormDataBuilder(options);
};

export const validateFormDataCompatibility = (data: any): {
    isCompatible: boolean;
    issues: string[];
} => {
    const issues: string[] = [];

    const checkValue = (value: any, path: string = 'root') => {
        if (typeof value === 'function') {
            issues.push(`Function found at ${path} - functions cannot be serialized`);
        } else if (typeof value === 'symbol') {
            issues.push(`Symbol found at ${path} - symbols will be converted to string`);
        } else if (value instanceof Map || value instanceof Set) {
            issues.push(`${value.constructor.name} found at ${path} - will be serialized as JSON`);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
        } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([key, val]) =>
                checkValue(val, `${path}.${key}`)
            );
        }
    };

    checkValue(data);

    return {
        isCompatible: issues.length === 0,
        issues
    };
};

export default { makeFormData, makeAdvancedFormData, AdvancedFormDataBuilder };