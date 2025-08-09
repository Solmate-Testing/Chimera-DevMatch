/**
 * IPFS Upload Component with Progress Tracking
 * 
 * Features:
 * 1. Drag & drop file upload
 * 2. Real-time upload progress
 * 3. File validation and preview
 * 4. CID display and verification
 * 5. Upload history management
 * 6. Multiple gateway links
 * 7. Error handling with retry
 */

import React, { useState, useCallback, useRef } from 'react';
import { useIPFS, type IPFSFile } from '../hooks/useIPFS';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface IPFSUploadProps {
  onFileUploaded?: (file: IPFSFile) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  showHistory?: boolean;
  className?: string;
}

const ACCEPTED_FILE_TYPES = [
  '.json',
  '.txt',
  '.md',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.mp4',
  '.mp3',
  '.wav',
  '.zip'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const IPFSUpload: React.FC<IPFSUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes = ACCEPTED_FILE_TYPES,
  maxFileSize = MAX_FILE_SIZE,
  showHistory = true,
  className = ''
}) => {
  const {
    uploadFile,
    uploadProgress,
    isUploading,
    error,
    uploadHistory,
    clearError,
    getIPFSUrl,
    validateCID
  } = useIPFS();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    description: '',
    tags: '',
    category: 'ai-agent'
  });
  const [lastUploadedFile, setLastUploadedFile] = useState<IPFSFile | null>(null);
  const [copiedCID, setCopiedCID] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file icon based on type
  const getFileIcon = (file: File | IPFSFile) => {
    const type = 'type' in file ? file.type : file.name.split('.').pop()?.toLowerCase();
    
    if (type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(type || '')) {
      return <PhotoIcon className="w-8 h-8 text-blue-400" />;
    } else if (type?.startsWith('video/') || ['mp4', 'mov', 'avi'].includes(type || '')) {
      return <VideoCameraIcon className="w-8 h-8 text-purple-400" />;
    } else if (type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(type || '')) {
      return <MusicalNoteIcon className="w-8 h-8 text-green-400" />;
    }
    return <DocumentIcon className="w-8 h-8 text-slate-400" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    clearError();
    
    const validationError = validateFile(file);
    if (validationError) {
      console.error('File validation failed:', validationError);
      return;
    }

    setSelectedFile(file);
    console.log('📁 File selected:', file.name, formatFileSize(file.size));
  }, [clearError, acceptedFileTypes, maxFileSize]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const uploadMetadata = {
        description: metadata.description || undefined,
        tags: metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : undefined,
        category: metadata.category || undefined
      };

      const uploadedFile = await uploadFile(selectedFile, uploadMetadata);
      setLastUploadedFile(uploadedFile);
      setSelectedFile(null);
      setMetadata({ description: '', tags: '', category: 'ai-agent' });
      
      if (onFileUploaded) {
        onFileUploaded(uploadedFile);
      }

      console.log('🎉 Upload completed:', uploadedFile);
    } catch (err) {
      console.error('❌ Upload failed:', err);
    }
  };

  // Copy CID to clipboard
  const copyCID = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      setCopiedCID(cid);
      setTimeout(() => setCopiedCID(null), 2000);
    } catch (err) {
      console.error('Failed to copy CID:', err);
    }
  };

  // Copy IPFS URL to clipboard
  const copyIPFSUrl = async (cid: string) => {
    try {
      const url = getIPFSUrl(cid);
      await navigator.clipboard.writeText(url);
      setCopiedCID(cid + '_url');
      setTimeout(() => setCopiedCID(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <CloudArrowUpIcon className="w-6 h-6" />
          <span>Upload to IPFS</span>
        </h3>

        {/* Drag & Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : selectedFile
              ? 'border-green-500 bg-green-500/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="text-center">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {getFileIcon(selectedFile)}
                </div>
                <div>
                  <div className="text-white font-medium">{selectedFile.name}</div>
                  <div className="text-slate-400 text-sm">{formatFileSize(selectedFile.size)}</div>
                </div>
                <div className="flex justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CloudArrowUpIcon className="w-16 h-16 text-slate-400 mx-auto" />
                <div>
                  <div className="text-white font-medium">Drop files here or click to browse</div>
                  <div className="text-slate-400 text-sm mt-1">
                    Supported: {acceptedFileTypes.slice(0, 5).join(', ')}
                    {acceptedFileTypes.length > 5 && ` and ${acceptedFileTypes.length - 5} more`}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Max size: {formatFileSize(maxFileSize)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Form */}
        {selectedFile && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this file..."
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={metadata.tags}
                  onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="ai-agent, model, dataset..."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={metadata.category}
                  onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="ai-agent">AI Agent</option>
                  <option value="dataset">Dataset</option>
                  <option value="model">Model</option>
                  <option value="metadata">Metadata</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Upload to IPFS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300 capitalize">{uploadProgress.stage}</span>
              <span className="text-slate-400">{uploadProgress.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Display */}
        {lastUploadedFile && (
          <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Upload Successful!</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-slate-400 mb-1">IPFS CID:</div>
                <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-2">
                  <code className="text-sm text-white font-mono flex-1 truncate">
                    {lastUploadedFile.cid}
                  </code>
                  <button
                    onClick={() => copyCID(lastUploadedFile.cid)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy CID"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(getIPFSUrl(lastUploadedFile.cid), '_blank')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="View on IPFS"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Gateway:</span>
                  <span className="text-white ml-2">{lastUploadedFile.pinningService}</span>
                </div>
                <div>
                  <span className="text-slate-400">Size:</span>
                  <span className="text-white ml-2">{formatFileSize(lastUploadedFile.size)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => copyIPFSUrl(lastUploadedFile.cid)}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Copy IPFS URL</span>
                </button>
              </div>
            </div>

            {copiedCID && (
              <div className="mt-2 text-center text-sm text-green-400">
                {copiedCID.includes('_url') ? 'IPFS URL copied!' : 'CID copied!'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload History */}
      {showHistory && uploadHistory.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Uploads</h4>
          <div className="space-y-3">
            {uploadHistory.slice(0, 5).map((file, index) => (
              <div key={`${file.cid}-${index}`} className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{file.name}</div>
                  <div className="text-slate-400 text-xs">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyCID(file.cid)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy CID"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(getIPFSUrl(file.cid), '_blank')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="View on IPFS"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};