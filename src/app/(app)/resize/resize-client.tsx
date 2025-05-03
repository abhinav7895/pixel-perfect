'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiUploadCloud, 
  FiDownload, 
  FiSliders, 
  FiImage, 
  FiInfo, 
  FiX, 
  FiCheck, 
  FiRefreshCw,
  FiArrowLeft,
  FiShield,
  FiMaximize2,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import Link from 'next/link';

interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ProcessedFile {
  id: string;
  originalFile: File;
  resizedFile: File;
  originalSize: number;
  resizedSize: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
  resizedPreview: string;
}


const ResizeClient = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [resizeOption, setResizeOption] = useState<'dimensions' | 'percentage' | 'maxSize'>('dimensions');
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [percentage, setPercentage] = useState<number>(50);
  const [maxSize, setMaxSize] = useState<number>(1024);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [imageFormat, setImageFormat] = useState<'keep' | 'jpg' | 'png' | 'webp'>('keep');
  const [imageQuality, setImageQuality] = useState<number>(90);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filePromises = acceptedFiles.map(async (file) => {
      const image = new Image();
      const preview = URL.createObjectURL(file);
      
      const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
        image.onload = () => {
          resolve({
            width: image.width,
            height: image.height
          });
        };
        image.src = preview;
      });

      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        originalSize: file.size,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        status: 'pending' as const
      };
    });

    const newFiles = await Promise.all(filePromises);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.avif']
    },
    maxSize: 25 * 1024 * 1024, 
  });

  const removeFile = (id: string) => {
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const processedFileToRemove = processedFiles.find(file => file.id === id);
    if (processedFileToRemove) {
      URL.revokeObjectURL(processedFileToRemove.resizedPreview);
    }
    
    setFiles(prev => prev.filter(file => file.id !== id));
    setProcessedFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAllFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    processedFiles.forEach(file => URL.revokeObjectURL(file.resizedPreview));
    setFiles([]);
    setProcessedFiles([]);
    setTotalSaved(0);
  };

  // calculate new dimensions based on settings
  const calculateNewDimensions = (originalWidth: number, originalHeight: number) => {
    let newWidth: number = originalWidth;
    let newHeight: number = originalHeight;
    
    if (resizeOption === 'dimensions') {
      newWidth = width;
      newHeight = maintainAspectRatio 
        ? Math.round((width / originalWidth) * originalHeight) 
        : height;
    } else if (resizeOption === 'percentage') {
      const factor = percentage / 100;
      newWidth = Math.round(originalWidth * factor);
      newHeight = Math.round(originalHeight * factor);
    } else if (resizeOption === 'maxSize') {
      if (originalWidth >= originalHeight) {
        // landscape or square image
        newWidth = maxSize;
        newHeight = maintainAspectRatio 
          ? Math.round((maxSize / originalWidth) * originalHeight)
          : maxSize;
      } else {
        // portrait image
        newHeight = maxSize;
        newWidth = maintainAspectRatio 
          ? Math.round((maxSize / originalHeight) * originalWidth)
          : maxSize;
      }
    }
    
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);
    
    return { width: newWidth, height: newHeight };
  };

  const resizeImage = async (fileObj: FileWithPreview): Promise<ProcessedFile | null> => {
    const { file, id, originalWidth, originalHeight } = fileObj;
    
    try {
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'processing' } : f
      ));

      const newDimensions = calculateNewDimensions(originalWidth, originalHeight);
      
      const canvas = document.createElement('canvas');
      canvas.width = newDimensions.width;
      canvas.height = newDimensions.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      const img = new Image();
      img.src = fileObj.preview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);
      
      let contentType: string;
      let filename = file.name;
      const originalExt = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (imageFormat === 'keep') {
        switch (originalExt) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          default:
            contentType = 'image/jpeg';
            break;
        }
      } else {
        contentType = `image/${imageFormat}`;
        
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        filename = `${baseName}.${imageFormat}`;
      }
    
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          resolve(b as Blob);
        }, contentType, imageQuality / 100);
      });
      
      const resizedFile = new File([blob], filename, {
        type: contentType,
        lastModified: new Date().getTime()
      });
      
      const resizedPreview = URL.createObjectURL(resizedFile);
      
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'done' } : f
      ));
      
      return {
        id,
        originalFile: file,
        resizedFile,
        originalSize: file.size,
        resizedSize: resizedFile.size,
        originalDimensions: { width: originalWidth, height: originalHeight },
        newDimensions,
        resizedPreview
      };
    } catch (error) {
      console.error('Error resizing image:', error);
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error' } : f
      ));
      return null;
    }
  };

  const resizeAllImages = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      const results = await Promise.all(
        pendingFiles.map(fileObj => resizeImage(fileObj))
      );
      
      const validResults = results.filter(Boolean) as ProcessedFile[];
      setProcessedFiles(prev => [...prev, ...validResults]);
      
      const savedBytes = validResults.reduce((total, file) => {
        return total + (file.originalSize - file.resizedSize);
      }, 0);
      setTotalSaved(prev => prev + savedBytes);
      
      setActiveTab('results');
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (resizedFile: File, originalName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(resizedFile);
    
    const fileExt = resizedFile.name.split('.').pop();
    const fileName = originalName.replace(/\.[^/.]+$/, '');
    link.download = `${fileName}_resized.${fileExt}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const downloadAllFiles = () => {
    processedFiles.forEach(({ resizedFile, originalFile }) => {
      downloadFile(resizedFile, originalFile.name);
    });
  };

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
      processedFiles.forEach(file => URL.revokeObjectURL(file.resizedPreview));
    };
  }, [files, processedFiles]);

  useEffect(() => {
    if (maintainAspectRatio && files.length > 0) {
      const firstFile = files[0];
      if (firstFile && firstFile.originalWidth && firstFile.originalHeight) {
        const aspectRatio = firstFile.originalWidth / firstFile.originalHeight;
        if (resizeOption === 'dimensions') {
          setHeight(Math.round(width / aspectRatio));
        }
      }
    }
  }, [width, maintainAspectRatio, files, resizeOption]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                Image <span className="text-orange-700">Resizer</span>
              </h1>
              <p className="mt-2 text-xl text-neutral-600 max-w-3xl">
                Easily resize and convert images to your desired dimensions. Everything happens in your browser.
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
              Upload & Resize
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'results'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Results {processedFiles.length > 0 && `(${processedFiles.length})`}
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
                      Supports JPG, PNG, WebP, GIF, AVIF • Max 25MB per file
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
                              <p className="text-xs text-neutral-500">
                                {fileObj.originalWidth} × {fileObj.originalHeight} • {formatFileSize(fileObj.originalSize)}
                              </p>
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
                        onClick={resizeAllImages}
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
                            Resizing...
                          </>
                        ) : (
                          <>
                            <FiMaximize2 className="mr-2 h-5 w-5" />
                            Resize {files.filter(f => f.status === 'pending').length > 0 ? 
                              `${files.filter(f => f.status === 'pending').length} ${files.filter(f => f.status === 'pending').length === 1 ? 'Image' : 'Images'}` : 
                              'Images'}
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
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">Resize Settings</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-neutral-800">Resize Method</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setResizeOption('dimensions')}
                          className={`py-2.5 px-4 rounded-lg border-2 text-center transition-all ${
                            resizeOption === 'dimensions'
                              ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          Custom Dimensions
                        </button>
                        <button
                          onClick={() => setResizeOption('percentage')}
                          className={`py-2.5 px-4 rounded-lg border-2 text-center transition-all ${
                            resizeOption === 'percentage'
                              ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          Scale by Percentage
                        </button>
                        <button
                          onClick={() => setResizeOption('maxSize')}
                          className={`py-2.5 px-4 rounded-lg border-2 text-center transition-all ${
                            resizeOption === 'maxSize'
                              ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          Maximum Size
                        </button>
                      </div>
                    </div>

                    {resizeOption === 'dimensions' && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="width" className="block text-sm font-medium text-neutral-700 mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            id="width"
                            min="1"
                            max="10000"
                            value={width}
                            onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 border text-neutral-700 border-neutral-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="height" className="block text-sm font-medium text-neutral-700 mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            id="height"
                            min="1"
                            max="10000"
                            value={height}
                            onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={maintainAspectRatio}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                              maintainAspectRatio 
                                ? 'bg-neutral-100 border-neutral-300 text-neutral-500' 
                                : 'border-neutral-300 text-neutral-700 focus:ring-orange-500 focus:border-orange-500'
                            }`}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="maintainAspectRatio"
                            type="checkbox"
                            checked={maintainAspectRatio}
                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                          />
                          <label htmlFor="maintainAspectRatio" className="ml-2 text-sm text-neutral-700 flex items-center">
                            {maintainAspectRatio ? (
                              <FiLock className="mr-1 h-4 w-4 text-orange-600" />
                            ) : (
                              <FiUnlock className="mr-1 h-4 w-4 text-neutral-500" />
                            )}
                            Maintain aspect ratio
                          </label>
                        </div>
                      </div>
                    )}

                    {resizeOption === 'percentage' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="percentage" className="block text-sm font-medium text-neutral-700">
                            Scale to
                          </label>
                          <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                            {percentage}%
                          </span>
                        </div>
                        <input
                          type="range"
                          id="percentage"
                          min="1"
                          max="200"
                          value={percentage}
                          onChange={(e) => setPercentage(parseInt(e.target.value))}
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-2">
                          <span>Smaller (1%)</span>
                          <span>Original (100%)</span>
                          <span>Larger (200%)</span>
                        </div>
                      </div>
                    )}

                    {resizeOption === 'maxSize' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="maxSize" className="block text-sm font-medium text-neutral-700">
                            Maximum dimension
                          </label>
                          <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                            {maxSize} px
                          </span>
                        </div>
                        <input
                          type="range"
                          id="maxSize"
                          min="100"
                          max="4000"
                          step="100"
                          value={maxSize}
                          onChange={(e) => setMaxSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-2">
                          <span>100px</span>
                          <span>4000px</span>
                        </div>
                        <p className="text-sm text-neutral-600 mt-2">
                          Maintains aspect ratio and ensures the largest dimension (width or height) doesn't exceed this value.
                        </p>
                        
                        <div className="mt-4 flex items-center">
                          <input
                            id="maintainAspectRatioMax"
                            type="checkbox"
                            checked={maintainAspectRatio}
                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                          />
                          <label htmlFor="maintainAspectRatioMax" className="ml-2 text-sm text-neutral-700 flex items-center">
                            {maintainAspectRatio ? (
                              <FiLock className="mr-1 h-4 w-4 text-orange-600" />
                            ) : (
                              <FiUnlock className="mr-1 h-4 w-4 text-neutral-500" />
                            )}
                            Maintain aspect ratio
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t border-neutral-200 pt-6">
                      <h3 className="text-lg font-medium text-neutral-800 mb-4">Format Options</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="imageFormat" className="block text-sm font-medium text-neutral-700 mb-2">
                            Image Format
                          </label>
                          <select
                            id="imageFormat"
                            value={imageFormat}
                            onChange={(e) => setImageFormat(e.target.value as 'keep' | 'jpg' | 'png' | 'webp')}
                            className="w-full px-3 py-2 border text-neutral-700 border-neutral-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="keep">Keep original format</option>
                            <option value="jpg">Convert to JPG</option>
                            <option value="png">Convert to PNG</option>
                            <option value="webp">Convert to WebP</option>
                          </select>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="imageQuality" className="block text-sm font-medium text-neutral-700">
                              Image Quality
                            </label>
                            <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                              {imageQuality}%
                            </span>
                          </div>
                          <input
                            type="range"
                            id="imageQuality"
                            min="10"
                            max="100"
                            value={imageQuality}
                            onChange={(e) => setImageQuality(parseInt(e.target.value))}
                            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                          />
                          <div className="flex justify-between text-xs text-neutral-500 mt-2">
                            <span>Lower quality</span>
                            <span>Higher quality</span>
                          </div>
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
            {processedFiles.length > 0 ? (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-neutral-900">Processed Images</h2>
                      <div className="flex space-x-4">
                        <button
                          onClick={downloadAllFiles}
                          className="py-2 px-4 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium flex items-center shadow-sm"
                        >
                          <FiDownload className="mr-2 h-5 w-5" />
                          Download All
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="py-2 px-4 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium flex items-center"
                        >
                          <FiUploadCloud className="mr-2 h-5 w-5" />
                          Upload More
                        </button>
                      </div>
                    </div>
                    
                    {totalSaved > 0 && (
                      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                        <div className="flex-shrink-0">
                          <FiCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            You saved {formatFileSize(totalSaved)} of space ({(totalSaved / processedFiles.reduce((total, file) => total + file.originalSize, 0) * 100).toFixed(0)}% reduction)
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {processedFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="bg-neutral-100 h-48 flex items-center justify-center overflow-hidden">
                            <img
                              src={file.resizedPreview}
                              alt={file.originalFile.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-medium text-neutral-900 truncate">
                              {file.resizedFile.name}
                            </h3>
                            
                            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-neutral-500">
                              <div>Original size:</div>
                              <div className="text-right font-medium">{formatFileSize(file.originalSize)}</div>
                              
                              <div>New size:</div>
                              <div className="text-right font-medium">{formatFileSize(file.resizedSize)}</div>
                              
                              <div>Original dimensions:</div>
                              <div className="text-right font-medium">{file.originalDimensions.width} × {file.originalDimensions.height}</div>
                              
                              <div>New dimensions:</div>
                              <div className="text-right font-medium">{file.newDimensions.width} × {file.newDimensions.height}</div>
                              
                              <div>Reduction:</div>
                              <div className="text-right font-medium">
                                {(((file.originalSize - file.resizedSize) / file.originalSize) * 100).toFixed(1)}%
                              </div>
                            </div>
                            
                            <button
                              onClick={() => downloadFile(file.resizedFile, file.originalFile.name)}
                              className="mt-4 w-full py-2 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium flex items-center justify-center transition-colors text-sm"
                            >
                              <FiDownload className="mr-2 h-4 w-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <FiImage className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900">No processed images yet</h3>
                <p className="mt-2 text-neutral-600">
                  Upload and resize some images to see results here
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-6 py-2 px-4 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium inline-flex items-center"
                >
                  <FiUploadCloud className="mr-2 h-5 w-5" />
                  Upload Images
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-neutral-50 border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">ImageResizer</h2>
              <p className="mt-2 text-neutral-600">
                A free, open-source tool to resize images directly in your browser.
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex items-center">
              <FiInfo className="h-5 w-5 text-neutral-400" />
              <p className="ml-2 text-sm text-neutral-600">
                Your images are processed locally and never uploaded to any server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResizeClient