/**
 * Web3.Storage Integration Utilities
 * 
 * Mock implementation for IPFS file uploads with Web3.Storage
 * In production, replace with actual Web3.Storage client
 */

// Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  cid: string;
  url: string;
  size: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

// Mock Web3.Storage client
class MockWeb3Storage {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Mock file upload to IPFS
   * In production, use actual Web3.Storage upload
   */
  async put(files: File[], options: UploadOptions = {}): Promise<string> {
    const { onProgress, signal } = options;
    
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Upload aborted'));
        return;
      }

      let progress = 0;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      const interval = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(interval);
          reject(new Error('Upload aborted'));
          return;
        }

        progress += Math.random() * 15 + 5; // 5-20% increments
        const loaded = Math.min((progress / 100) * totalSize, totalSize);
        
        if (onProgress) {
          onProgress({
            loaded,
            total: totalSize,
            percentage: Math.min(progress, 100),
          });
        }

        if (progress >= 100) {
          clearInterval(interval);
          
          // Generate mock IPFS CID
          const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
          
          setTimeout(() => resolve(mockCid), 200);
        }
      }, 100 + Math.random() * 200); // Random delay for realism

      // Simulate network errors occasionally
      if (Math.random() < 0.05) { // 5% chance
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Network timeout - please try again'));
        }, 2000 + Math.random() * 3000);
      }
    });
  }

  /**
   * Get IPFS URL for CID
   */
  static getGatewayUrl(cid: string): string {
    return `https://w3s.link/ipfs/${cid}`;
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    const allowedTypes = [
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/json',
      'text/x-python',
      'application/javascript',
      'application/typescript',
      'text/markdown',
      'text/plain',
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5GB' };
    }

    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]))) {
      return { 
        valid: false, 
        error: 'File type not supported. Please upload .zip, .tar.gz, .json, .py, .js, .ts, or .md files' 
      };
    }

    return { valid: true };
  }
}

// Web3.Storage client instance
const web3Storage = new MockWeb3Storage(
  process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || 'mock-token'
);

/**
 * Upload file to IPFS via Web3.Storage
 */
export async function uploadToIPFS(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Validate file
  const validation = MockWeb3Storage.validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const cid = await web3Storage.put([file], options);
    
    return {
      cid,
      url: MockWeb3Storage.getGatewayUrl(cid),
      size: file.size,
    };
  } catch (error: any) {
    console.error('IPFS upload failed:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple files to IPFS
 */
export async function uploadFilesToIPFS(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Validate all files
  for (const file of files) {
    const validation = MockWeb3Storage.validateFile(file);
    if (!validation.valid) {
      throw new Error(`${file.name}: ${validation.error}`);
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  try {
    const cid = await web3Storage.put(files, options);
    
    return {
      cid,
      url: MockWeb3Storage.getGatewayUrl(cid),
      size: totalSize,
    };
  } catch (error: any) {
    console.error('IPFS upload failed:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Get file from IPFS
 */
export async function getFromIPFS(cid: string): Promise<Response> {
  const url = MockWeb3Storage.getGatewayUrl(cid);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error: any) {
    console.error('IPFS fetch failed:', error);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
}

/**
 * Check if CID exists and is accessible
 */
export async function verifyCID(cid: string): Promise<boolean> {
  try {
    const response = await getFromIPFS(cid);
    return response.ok;
  } catch {
    return false;
  }
}

// Export Web3.Storage utilities
export { MockWeb3Storage };
export default web3Storage;