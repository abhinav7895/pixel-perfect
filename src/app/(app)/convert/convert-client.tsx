'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiUploadCloud, 
  FiDownload, 
  FiRefreshCw,
  FiImage, 
  FiInfo, 
  FiX, 
  FiCheck,
  FiArrowLeft,
  FiShield,
  FiRepeat
} from 'react-icons/fi';
import Link from 'next/link';

interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  originalFormat: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ConvertedFile {
  id: string;
  originalFile: File;
  convertedFile: File;
  originalSize: number;
  convertedSize: number;
  originalFormat: string;
  convertedFormat: string;
  convertedPreview: string;
}

const ConvertClient = () => {

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  const [totalConversions, setTotalConversions] = useState<number>(0);

  // handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        originalSize: file.size,
        originalFormat: fileExtension,
        status: 'pending' as const
      };
    });
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // dropzone config.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff']
    },
    maxSize: 25 * 1024 * 1024, // 25mb max
  });

  // file management 
  const removeFile = (id: string) => {
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const convertedFileToRemove = convertedFiles.find(file => file.id === id);
    if (convertedFileToRemove) {
      URL.revokeObjectURL(convertedFileToRemove.convertedPreview);
    }
    
    setFiles(prev => prev.filter(file => file.id !== id));
    setConvertedFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAllFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    convertedFiles.forEach(file => URL.revokeObjectURL(file.convertedPreview));
    setFiles([]);
    setConvertedFiles([]);
    setTotalConversions(0);
  };

  // image conversion
  const convertImage = async (fileObj: FileWithPreview): Promise<ConvertedFile | null> => {
    const { file, id, originalFormat } = fileObj;
    
    try {
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'processing' } : f
      ));

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          let mimeType: string;
          switch (targetFormat) {
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              break;
            case 'png':
              mimeType = 'image/png';
              break;
            case 'webp':
              mimeType = 'image/webp';
              break;
            case 'gif':
              mimeType = 'image/gif';
              break;
            case 'bmp':
              mimeType = 'image/bmp';
              break;
            default:
              mimeType = 'image/png';
          }
          
          const quality = 0.9;
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const convertedFile = new File([blob], `${fileName}.${targetFormat}`, {
              type: mimeType,
              lastModified: new Date().getTime()
            });
            
            const convertedPreview = URL.createObjectURL(convertedFile);
            
            setFiles(prev => prev.map(f => 
              f.id === id ? { ...f, status: 'done' } : f
            ));
            
            resolve({
              id,
              originalFile: file,
              convertedFile,
              originalSize: file.size,
              convertedSize: convertedFile.size,
              originalFormat,
              convertedFormat: targetFormat,
              convertedPreview
            });
          }, mimeType, quality);
          
          // Cleanup
          URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, status: 'error' } : f
          ));
          URL.revokeObjectURL(img.src);
        };
      });
    } catch (error) {
      console.error('Error converting image:', error);
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error' } : f
      ));
      return null;
    }
  };

  const convertAllImages = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      const results = await Promise.all(
        pendingFiles.map(fileObj => convertImage(fileObj))
      );
      
      const validResults = results.filter(Boolean) as ConvertedFile[];
      setConvertedFiles(prev => [...prev, ...validResults]);
      setTotalConversions(prev => prev + validResults.length);
      setActiveTab('results');
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (convertedFile: File, originalName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(convertedFile);
    link.download = convertedFile.name;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); 
  };

  const downloadAllFiles = () => {
    convertedFiles.forEach(({ convertedFile }) => {
      downloadFile(convertedFile, convertedFile.name);
    });
  };

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
      convertedFiles.forEach(file => URL.revokeObjectURL(file.convertedPreview));
    };
  }, [files, convertedFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatLabel = (format: string): string => {
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'JPEG';
      case 'png':
        return 'PNG';
      case 'webp':
        return 'WebP';
      case 'gif':
        return 'GIF';
      case 'bmp':
        return 'BMP';
      case 'tiff':
      case 'tif':
        return 'TIFF';
      case 'avif':
        return 'AVIF';
      default:
        return format.toUpperCase();
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiImage className="h-5 w-5 text-neutral-500" />;
      case 'processing':
        return <FiRefreshCw className="h-5 w-5 text-orange-500 animate-spin" />;
      case 'done':
        return <FiCheck className="h-5 w-5 text-green-600" />;
      case 'error':
        return <FiX className="h-5 w-5 text-red-600" />;
      default:
        return <FiImage className="h-5 w-5 text-neutral-500" />;
    }
  };

  const isConversionNeeded = (fileFormat: string) => {
    return fileFormat.toLowerCase() !== targetFormat.toLowerCase();
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-10 border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium mb-4">
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl md:text-5xl">
                Image <span className="text-orange-700">Converter</span>
              </h1>
              <p className="mt-2 text-xl text-neutral-600 max-w-3xl">
                Convert your images to different formats in seconds. Everything happens in your browser.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="flex items-center bg-white px-4 py-3 rounded-lg shadow-sm border border-orange-200">
                <FiShield className="h-6 w-6 text-orange-600" />
                <p className="ml-2 text-sm font-medium text-neutral-700">
                  100% Private: Your images never leave your device
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-neutral-200 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'upload'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Upload & Convert
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'results'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Results {convertedFiles.length > 0 && `(${convertedFiles.length})`}
            </button>
          </div>
        </div>

        {activeTab === 'upload' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Upload Images</h2>
                  
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDragActive 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-neutral-300 hover:border-orange-400 hover:bg-orange-50/30'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FiUploadCloud className="mx-auto h-16 w-16 text-neutral-400" />
                    <p className="mt-4 text-lg font-medium text-neutral-800">
                      {isDragActive 
                        ? "Drop the images here..." 
                        : "Drag & drop images here"}
                    </p>
                    <p className="text-neutral-600 mt-2">
                      or <span className="text-orange-600 font-medium">browse files</span>
                    </p>
                    <p className="text-sm text-neutral-500 mt-3">
                      Supports JPG, PNG, WebP, GIF, AVIF, BMP, TIFF • Max 25MB per file
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-neutral-800">
                          {files.length} {files.length === 1 ? 'Image' : 'Images'} Selected
                        </h3>
                        <button
                          onClick={clearAllFiles}
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 transition-colors flex items-center"
                        >
                          <FiX className="mr-1 h-4 w-4" />
                          Clear all
                        </button>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {files.map((fileObj) => (
                          <div 
                            key={fileObj.id} 
                            className="flex items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3"
                          >
                            <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-white border border-neutral-200">
                              <img
                                src={fileObj.preview}
                                alt={fileObj.file.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {fileObj.file.name}
                              </p>
                              <div className="flex items-center text-xs text-neutral-500">
                                <span>{formatFileSize(fileObj.originalSize)}</span>
                                <span className="mx-1">•</span>
                                <span className="uppercase">{fileObj.originalFormat}</span>
                                
                                {isConversionNeeded(fileObj.originalFormat) ? (
                                  <span className="flex items-center ml-2 text-orange-600">
                                    <FiRepeat className="h-3 w-3 mr-1" />
                                    <span>Will convert to {targetFormat.toUpperCase()}</span>
                                  </span>
                                ) : (
                                  <span className="ml-2 text-neutral-600">
                                    (Already in target format)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-3 flex-shrink-0 flex items-center">
                              {getFileStatusIcon(fileObj.status)}
                              <button 
                                onClick={() => removeFile(fileObj.id)}
                                className="ml-2 text-neutral-400 hover:text-red-500 p-1"
                              >
                                <FiX className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={convertAllImages}
                        disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                        className={`w-full mt-6 py-3 px-4 rounded-lg text-lg font-medium flex items-center justify-center transition-all ${
                          isProcessing || files.filter(f => f.status === 'pending').length === 0
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <FiRefreshCw className="animate-spin mr-2 h-5 w-5" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <FiRepeat className="mr-2 h-5 w-5" />
                            Convert to {targetFormat.toUpperCase()}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden sticky top-6">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">Conversion Options</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-neutral-800">Target Format</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {['png', 'jpg', 'webp', 'gif', 'bmp'].map((format) => (
                          <button
                            key={format}
                            onClick={() => setTargetFormat(format)}
                            className={`py-3 px-4 rounded-lg border-2 text-center transition-all ${
                              targetFormat === format
                                ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium'
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <h3 className="text-lg font-medium text-neutral-800 mb-3">Format Information</h3>
                      
                      {targetFormat === 'png' && (
                        <div className="space-y-2 text-sm text-neutral-600">
                          <p><strong>PNG</strong> (Portable Network Graphics)</p>
                          <p>• Lossless compression with transparency support</p>
                          <p>• Best for graphics, logos, and images with text</p>
                          <p>• Larger file size than JPG or WebP</p>
                        </div>
                      )}
                      
                      {targetFormat === 'jpg' && (
                        <div className="space-y-2 text-sm text-neutral-600">
                          <p><strong>JPG/JPEG</strong> (Joint Photographic Experts Group)</p>
                          <p>• Lossy compression without transparency</p>
                          <p>• Ideal for photographs and complex images</p>
                          <p>• Smaller file size than PNG</p>
                        </div>
                      )}
                      
                      {targetFormat === 'webp' && (
                        <div className="space-y-2 text-sm text-neutral-600">
                          <p><strong>WebP</strong></p>
                          <p>• Modern format with superior compression</p>
                          <p>• Supports transparency and animation</p>
                          <p>• Smaller files than PNG and JPG</p>
                          <p>• Great for web usage</p>
                        </div>
                      )}
                      
                      {targetFormat === 'gif' && (
                        <div className="space-y-2 text-sm text-neutral-600">
                          <p><strong>GIF</strong> (Graphics Interchange Format)</p>
                          <p>• Supports animation and transparency</p>
                          <p>• Limited to 256 colors</p>
                          <p>• Best for simple animations and graphics</p>
                        </div>
                      )}
                      
                      {targetFormat === 'bmp' && (
                        <div className="space-y-2 text-sm text-neutral-600">
                          <p><strong>BMP</strong> (Bitmap)</p>
                          <p>• Uncompressed format</p>
                          <p>• Perfect pixel representation</p>
                          <p>• Much larger file sizes</p>
                          <p>• Used in specific applications</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex">
                        <FiInfo className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-orange-800">Privacy Guaranteed</h4>
                          <p className="mt-1 text-sm text-orange-700">
                            All conversion happens locally in your browser. Your images never leave your device, ensuring complete privacy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {convertedFiles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-neutral-200">
                <FiImage className="mx-auto h-16 w-16 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900">No converted images yet</h3>
                <p className="mt-2 text-neutral-600">Upload and convert some images to see results here</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-6 py-2 px-4 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors"
                >
                  Go to Upload
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Conversion Results</h2>
                        <p className="mt-1 text-neutral-600">
                          {convertedFiles.length} {convertedFiles.length === 1 ? 'image' : 'images'} converted successfully
                        </p>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        <button
                          onClick={downloadAllFiles}
                          className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center transition-colors shadow-sm"
                        >
                          <FiDownload className="mr-2 h-5 w-5" />
                          Download All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {convertedFiles.map((file) => (
                    <div key={file.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                      <div className="aspect-video bg-neutral-50 relative">
                        <img
                          src={file.convertedPreview}
                          alt={file.originalFile.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-medium text-neutral-900 truncate" title={file.convertedFile.name}>
                          {file.convertedFile.name}
                        </h3>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500">Original</p>
                            <p className="text-sm font-medium text-neutral-700">
                              {formatFileSize(file.originalSize)} • {getFormatLabel(file.originalFormat)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Converted</p>
                            <p className="text-sm font-medium text-orange-600">
                              {formatFileSize(file.convertedSize)} • {getFormatLabel(file.convertedFormat)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            onClick={() => downloadFile(file.convertedFile, file.originalFile.name)}
                            className="py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-medium flex items-center transition-colors"
                          >
                            <FiDownload className="mr-1.5 h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertClient;