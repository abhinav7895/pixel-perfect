'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  FiUploadCloud,
  FiDownload,
  FiCrop,
  FiImage,
  FiInfo,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiArrowLeft,
  FiShield,
  FiRotateCw,
  FiMaximize,
  FiSliders,
  FiSun
} from 'react-icons/fi';
import Link from 'next/link';

interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ProcessedFile {
  id: string;
  originalFile: File;
  processedFile: File;
  originalSize: number;
  processedSize: number;
  processedPreview: string;
  editType: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const CropClient = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [activeEditTool, setActiveEditTool] = useState<'crop' | 'rotate' | 'brightness'>('crop');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      status: 'pending' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.avif']
    },
    maxSize: 25 * 1024 * 1024, // 25MB max size
  });

  // file management functions
  const removeFile = (id: string) => {
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const processedFileToRemove = processedFiles.find(file => file.id === id);
    if (processedFileToRemove) {
      URL.revokeObjectURL(processedFileToRemove.processedPreview);
    }
    
    setFiles(prev => prev.filter(file => file.id !== id));
    setProcessedFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAllFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    processedFiles.forEach(file => URL.revokeObjectURL(file.processedPreview));
    setFiles([]);
    setProcessedFiles([]);
    setTotalSaved(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    setBrightness(100);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    if (aspect) {
      const crop = centerAspectCrop(width, height, aspect);
      setCrop(crop);
    } else {
      setCrop({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80
      });
    }
  };

  const setAspectRatio = (ratio: number | undefined) => {
    setAspect(ratio);
    
    if (ratio && imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, ratio);
      setCrop(newCrop);
    }
  };

  const applyCanvasEdits = (
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    crop: Crop,
    rotation: number = 0,
    brightness: number = 100
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    ctx.save();
    
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;
    
    const centerX = canvas.width / pixelRatio / 2;
    const centerY = canvas.height / pixelRatio / 2;
    
    if (rotation !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    ctx.drawImage(
      image,
      cropX, 
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
    
    if (brightness !== 100) {
      ctx.filter = `brightness(${brightness}%)`;
      ctx.drawImage(
        canvas, 
        0, 
        0, 
        canvas.width / pixelRatio, 
        canvas.height / pixelRatio
      );
      ctx.filter = 'none';
    }
    
    ctx.restore();
  };

  const processImage = async (fileObj: FileWithPreview): Promise<ProcessedFile | null> => {
    const { file, id } = fileObj;
    
    if (!imgRef.current || !completedCrop || !canvasRef.current) {
      console.error('Missing required references');
      return null;
    }
    
    try {
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'processing' } : f
      ));
      
      applyCanvasEdits(
        canvasRef.current, 
        imgRef.current, 
        completedCrop,
        rotation,
        brightness
      );
      
      return new Promise((resolve) => {
        canvasRef.current?.toBlob(blob => {
          if (!blob) {
            console.error('Canvas is empty');
            return null;
          }
        
          const processedFile = new File([blob], file.name.replace(/\.\w+$/, `-edited.jpg`), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          // preview url fixed
          const processedPreview = URL.createObjectURL(processedFile);
          
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, status: 'done' } : f
          ));
          
          // determine edit type description
          let editType = 'Cropped';
          if (rotation !== 0) editType += ', Rotated';
          if (brightness !== 100) editType += ', Adjusted';
          
          resolve({
            id,
            originalFile: file,
            processedFile,
            originalSize: file.size,
            processedSize: processedFile.size,
            processedPreview,
            editType
          });
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error processing image:', error);
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error' } : f
      ));
      return null;
    }
  };

  const processCurrentImage = async () => {
    if (files.length === 0 || currentFileIndex >= files.length) return;
    
    setIsProcessing(true);
    const currentFile = files[currentFileIndex];
    
    try {
      const result = await processImage(currentFile);
      
      if (result) {
        setProcessedFiles(prev => [...prev, result]);
        
        const sizeDiff = currentFile.originalSize - result.processedSize;
        setTotalSaved(prev => prev + sizeDiff);
      }
      
      if (currentFileIndex < files.length - 1) {
        setCurrentFileIndex(currentFileIndex + 1);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setRotation(0);
        setBrightness(100);
      } else {
        setActiveTab('results');
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (processedFile: File, originalName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(processedFile);
    
    const fileExt = originalName.split('.').pop();
    const fileName = originalName.replace(`.${fileExt}`, '');
    link.download = `${fileName}_edited.jpg`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); 
  };

  const downloadAllFiles = () => {
    processedFiles.forEach(({ processedFile, originalFile }) => {
      downloadFile(processedFile, originalFile.name);
    });
  };

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
      processedFiles.forEach(file => URL.revokeObjectURL(file.processedPreview));
    };
  }, [files, processedFiles]);

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
                Image <span className="text-orange-700">Editor</span>
              </h1>
              <p className="mt-2 text-xl text-neutral-600 max-w-3xl">
                Crop, rotate, and adjust your images with ease. Everything happens in your browser.
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
              Upload & Edit
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
          <div>
            {files.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
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
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-neutral-900">
                          Edit Image {currentFileIndex + 1} of {files.length}
                        </h2>
                        <div className="text-sm font-medium text-neutral-600">
                          {files[currentFileIndex]?.file.name}
                        </div>
                      </div>
                      
                      <div className="relative bg-neutral-100 rounded-lg overflow-hidden p-4 mb-6 flex justify-center">
                        <div className="relative">
                          <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            className={`${brightness !== 100 ? `brightness-${Math.round(brightness / 10)}` : ''}`}
                          >
                            <img
                              ref={imgRef}
                              src={files[currentFileIndex]?.preview}
                              alt="Edit preview"
                              style={{ 
                                transform: `rotate(${rotation}deg)`,
                                maxHeight: '60vh',
                                maxWidth: '100%'
                              }}
                              onLoad={onImageLoad}
                            />
                          </ReactCrop>
                        </div>
                      </div>
                      
                      <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                      />
                      
                      <div className="flex border-b border-neutral-200 mb-4">
                        <button
                          onClick={() => setActiveEditTool('crop')}
                          className={`px-4 py-2 flex items-center ${activeEditTool === 'crop' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-neutral-600'}`}
                        >
                          <FiCrop className="h-4 w-4 mr-2" />
                          Crop
                        </button>
                        <button
                          onClick={() => setActiveEditTool('rotate')}
                          className={`px-4 py-2 flex items-center ${activeEditTool === 'rotate' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-neutral-600'}`}
                        >
                          <FiRotateCw className="h-4 w-4 mr-2" />
                          Rotate
                        </button>
                        <button
                          onClick={() => setActiveEditTool('brightness')}
                          className={`px-4 py-2 flex items-center ${activeEditTool === 'brightness' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-neutral-600'}`}
                        >
                          <FiSun className="h-4 w-4 mr-2" />
                          Brightness
                        </button>
                      </div>
                      
                      <div className="mb-6">
                        {activeEditTool === 'crop' && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setAspectRatio(undefined)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === undefined ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                Free
                              </button>
                              <button
                                onClick={() => setAspectRatio(1)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === 1 ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                1:1
                              </button>
                              <button
                                onClick={() => setAspectRatio(4/3)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === 4/3 ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                4:3
                              </button>
                              <button
                                onClick={() => setAspectRatio(16/9)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === 16/9 ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                16:9
                              </button>
                              <button
                                onClick={() => setAspectRatio(3/4)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === 3/4 ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                3:4
                              </button>
                              <button
                                onClick={() => setAspectRatio(9/16)}
                                className={`px-3 py-2 text-sm rounded-md ${aspect === 9/16 ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-neutral-100 text-neutral-700'}`}
                              >
                                9:16
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {activeEditTool === 'rotate' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-neutral-700">Rotation</label>
                              <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                                {rotation}°
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={rotation}
                              onChange={(e) => setRotation(parseInt(e.target.value))}
                              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-2">
                              <span>-180°</span>
                              <span>0°</span>
                              <span>180°</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => setRotation(prev => prev - 90)}
                                className="px-3 py-2 bg-neutral-100 text-sm rounded-md text-neutral-700"
                              >
                                Rotate -90°
                              </button>
                              <button
                                onClick={() => setRotation(0)}
                                className="px-3 py-2 bg-neutral-100 text-sm rounded-md text-neutral-700"
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => setRotation(prev => prev + 90)}
                                className="px-3 py-2 bg-neutral-100 text-sm rounded-md text-neutral-700"
                              >
                                Rotate 90°
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {activeEditTool === 'brightness' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-neutral-700">Brightness</label>
                              <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                                {brightness}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              value={brightness}
                              onChange={(e) => setBrightness(parseInt(e.target.value))}
                              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-2">
                              <span>Darker</span>
                              <span>Normal</span>
                              <span>Brighter</span>
                            </div>
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={() => setBrightness(100)}
                                className="px-3 py-2 bg-neutral-100 text-sm rounded-md text-neutral-700"
                              >
                                Reset to 100%
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={clearAllFiles}
                          className="py-2 px-4 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={processCurrentImage}
                            disabled={isProcessing || !completedCrop?.width || !completedCrop?.height}
                            className={`py-2 px-4 rounded-lg text-lg font-medium flex items-center transition-all ${
                              isProcessing || !completedCrop?.width || !completedCrop?.height
                                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow'
                            }`}
                          >
                            {isProcessing ? (
                              <>
                                <FiRefreshCw className="animate-spin mr-2 h-5 w-5" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiCheck className="mr-2 h-5 w-5" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden sticky top-6">
                    <div className="p-6">
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
                      {files.map((file, index) => (
                          <div 
                            key={file.id}
                            className={`p-3 rounded-lg border flex items-center ${
                              currentFileIndex === index 
                                ? 'border-orange-200 bg-orange-50' 
                                : 'border-neutral-200 hover:border-orange-200 hover:bg-orange-50/30'
                            }`}
                          >
                            <div className="mr-3">
                              {getFileStatusIcon(file.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-800 truncate">
                                {file.file.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatFileSize(file.originalSize)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="ml-2 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-neutral-200">
                        <div
                          {...getRootProps()}
                          className="mb-4 px-4 py-3 border border-dashed border-neutral-300 rounded-lg text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                        >
                          <input {...getInputProps()} />
                          <div className="flex items-center justify-center text-neutral-600">
                            <FiUploadCloud className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Add more images</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {processedFiles.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Processed Images</h2>
                    <p className="text-neutral-600 mt-1">
                      {processedFiles.length} {processedFiles.length === 1 ? 'image' : 'images'} processed • 
                      {totalSaved > 0 
                        ? ` Saved ${formatFileSize(totalSaved)}` 
                        : ` Size increased by ${formatFileSize(Math.abs(totalSaved))}`}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setActiveTab('upload');
                        clearAllFiles();
                      }}
                      className="py-2 px-4 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center"
                    >
                      <FiX className="mr-2 h-5 w-5" />
                      Clear & Start Over
                    </button>
                    <button
                      onClick={downloadAllFiles}
                      className="py-2 px-4 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors shadow-sm hover:shadow flex items-center"
                    >
                      <FiDownload className="mr-2 h-5 w-5" />
                      Download All
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedFiles.map((processedFile) => (
                    <div 
                      key={processedFile.id}
                      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                        <img 
                          src={processedFile.processedPreview} 
                          alt={processedFile.originalFile.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-base font-medium text-neutral-800 truncate flex-1">
                            {processedFile.originalFile.name}
                          </h3>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md">
                            {processedFile.editType}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-neutral-600">Original: {formatFileSize(processedFile.originalSize)}</p>
                            <p className="text-neutral-600">New: {formatFileSize(processedFile.processedSize)}</p>
                          </div>
                          <div>
                            {processedFile.originalSize > processedFile.processedSize ? (
                              <p className="text-green-600 font-medium">
                                -{formatFileSize(processedFile.originalSize - processedFile.processedSize)}
                              </p>
                            ) : (
                              <p className="text-orange-600 font-medium">
                                +{formatFileSize(processedFile.processedSize - processedFile.originalSize)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => downloadFile(processedFile.processedFile, processedFile.originalFile.name)}
                          className="mt-4 w-full py-2 px-4 rounded-lg border border-orange-600 text-orange-600 font-medium hover:bg-orange-50 transition-colors flex items-center justify-center"
                        >
                          <FiDownload className="mr-2 h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiSliders className="h-12 w-12 text-neutral-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900">No images processed yet</h3>
                <p className="mt-2 text-neutral-600 max-w-md mx-auto">
                  Upload and edit your images first, then they'll appear here for download.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-6 py-2 px-4 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-sm hover:shadow transition-colors"
                >
                  Upload Images
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-12 pt-6 border-t border-neutral-200 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <FiInfo className="h-5 w-5 text-neutral-500 mr-2" />
              <h3 className="text-lg font-medium text-neutral-800">About This Tool</h3>
            </div>
            <p className="text-neutral-600">
              This image editor is built using React and runs entirely in your browser. 
              Your images are never uploaded to any server, ensuring complete privacy and security.
              Changes are processed locally on your device, making it fast and secure.
            </p>
            <div className="flex justify-center mt-4 space-x-6">
              <span className="text-sm text-neutral-500 flex items-center">
                <FiMaximize className="h-4 w-4 mr-1" /> Crop
              </span>
              <span className="text-sm text-neutral-500 flex items-center">
                <FiRotateCw className="h-4 w-4 mr-1" /> Rotate
              </span>
              <span className="text-sm text-neutral-500 flex items-center">
                <FiSun className="h-4 w-4 mr-1" /> Adjust Brightness
              </span>
              <span className="text-sm text-neutral-500 flex items-center">
                <FiDownload className="h-4 w-4 mr-1" /> Download
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropClient;