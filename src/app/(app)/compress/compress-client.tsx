"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
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
} from "react-icons/fi";
import Link from "next/link";
import imageCompression from "browser-image-compression";

interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  status: "pending" | "processing" | "done" | "error";
}

interface ProcessedFile {
  id: string;
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  compressedPreview: string;
}

const CompressClient = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(80);
  const [maxSizeInMB, setMaxSizeInMB] = useState<number>(1);
  const [compressionOption, setCompressionOption] = useState<
    "quality" | "size"
  >("quality");
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");
  const [totalSaved, setTotalSaved] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".avif"],
    },
    maxSize: 25 * 1024 * 1024,
  });

  const removeFile = (id: string) => {
    const fileToRemove = files.find((file) => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const processedFileToRemove = processedFiles.find((file) => file.id === id);
    if (processedFileToRemove) {
      URL.revokeObjectURL(processedFileToRemove.compressedPreview);
    }

    setFiles((prev) => prev.filter((file) => file.id !== id));
    setProcessedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const clearAllFiles = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    processedFiles.forEach((file) =>
      URL.revokeObjectURL(file.compressedPreview)
    );
    setFiles([]);
    setProcessedFiles([]);
    setTotalSaved(0);
  };

  const compressImage = async (
    fileObj: FileWithPreview
  ): Promise<ProcessedFile | null> => {
    const { file, id } = fileObj;

    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "processing" } : f))
      );

      const options =
        compressionOption === "quality"
          ? {
              maxSizeMB: 100,
              maxWidthOrHeight: 3840,
              useWebWorker: true,
              initialQuality: quality / 100,
            }
          : {
              maxSizeMB: maxSizeInMB,
              maxWidthOrHeight: 3840,
              useWebWorker: true,
            };

      const compressedFile = await imageCompression(file, options);

      const compressedPreview = URL.createObjectURL(compressedFile);

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "done" } : f))
      );

      return {
        id,
        originalFile: file,
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: (
          ((file.size - compressedFile.size) / file.size) *
          100
        ).toFixed(1),
        compressedPreview,
      };
    } catch (error) {
      console.error("Error compressing image:", error);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "error" } : f))
      );
      return null;
    }
  };

  const compressAllImages = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    try {
      const results = await Promise.all(
        pendingFiles.map((fileObj) => compressImage(fileObj))
      );

      const validResults = results.filter(Boolean) as ProcessedFile[];
      setProcessedFiles((prev) => [...prev, ...validResults]);

      const savedBytes = validResults.reduce((total, file) => {
        return total + (file.originalSize - file.compressedSize);
      }, 0);
      setTotalSaved((prev) => prev + savedBytes);
      setActiveTab("results");
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (compressedFile: File, originalName: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(compressedFile);

    const fileExt = originalName.split(".").pop();
    const fileName = originalName.replace(`.${fileExt}`, "");
    link.download = `${fileName}_compressed.${fileExt}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const downloadAllFiles = () => {
    processedFiles.forEach(({ compressedFile, originalFile }) => {
      downloadFile(compressedFile, originalFile.name);
    });
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
      processedFiles.forEach((file) =>
        URL.revokeObjectURL(file.compressedPreview)
      );
    };
  }, [files, processedFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FiImage className="h-5 w-5 text-neutral-500" />;
      case "processing":
        return <FiRefreshCw className="h-5 w-5 text-orange-500 animate-spin" />;
      case "done":
        return <FiCheck className="h-5 w-5 text-green-600" />;
      case "error":
        return <FiX className="h-5 w-5 text-red-600" />;
      default:
        return <FiImage className="h-5 w-5 text-neutral-500" />;
    }
  };

  const getQualityLabel = (quality: number): string => {
    if (quality >= 90) return "High Quality";
    if (quality >= 70) return "Balanced";
    if (quality >= 50) return "Medium Quality";
    return "Low Quality";
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-10 border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium mb-4"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl md:text-5xl">
                Image <span className="text-orange-700">Compressor</span>
              </h1>
              <p className="mt-2 text-xl text-neutral-600 max-w-3xl">
                Reduce file sizes while maintaining image quality. Everything
                happens in your browser.
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
              onClick={() => setActiveTab("upload")}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === "upload"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Upload & Compress
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === "results"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Results{" "}
              {processedFiles.length > 0 && `(${processedFiles.length})`}
            </button>
          </div>
        </div>

        {activeTab === "upload" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                    Upload Images
                  </h2>

                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? "border-orange-500 bg-orange-50"
                        : "border-neutral-300 hover:border-orange-400 hover:bg-orange-50/30"
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
                      or{" "}
                      <span className="text-orange-600 font-medium">
                        browse files
                      </span>
                    </p>
                    <p className="text-sm text-neutral-500 mt-3">
                      Supports JPG, PNG, WebP, GIF, AVIF • Max 25MB per file
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-neutral-800">
                          {files.length}{" "}
                          {files.length === 1 ? "Image" : "Images"} Selected
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
                                {formatFileSize(fileObj.originalSize)}
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
                        onClick={compressAllImages}
                        disabled={
                          isProcessing ||
                          files.filter((f) => f.status === "pending").length ===
                            0
                        }
                        className={`w-full mt-6 py-3 px-4 rounded-lg text-lg font-medium flex items-center justify-center transition-all ${
                          isProcessing ||
                          files.filter((f) => f.status === "pending").length ===
                            0
                            ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                            : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <FiRefreshCw className="animate-spin mr-2 h-5 w-5" />
                            Compressing...
                          </>
                        ) : (
                          <>
                            <FiSliders className="mr-2 h-5 w-5" />
                            Compress{" "}
                            {files.filter((f) => f.status === "pending")
                              .length > 0
                              ? `${
                                  files.filter((f) => f.status === "pending")
                                    .length
                                } ${
                                  files.filter((f) => f.status === "pending")
                                    .length === 1
                                    ? "Image"
                                    : "Images"
                                }`
                              : "Images"}
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
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                    Settings
                  </h2>

                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-neutral-800">
                          Compression Type
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setCompressionOption("quality")}
                          className={`py-3 px-4 rounded-lg border-2 text-center transition-all ${
                            compressionOption === "quality"
                              ? "bg-orange-50 border-orange-400 text-orange-800 font-medium"
                              : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          By Quality
                        </button>
                        <button
                          onClick={() => setCompressionOption("size")}
                          className={`py-3 px-4 rounded-lg border-2 text-center transition-all ${
                            compressionOption === "size"
                              ? "bg-orange-50 border-orange-400 text-orange-800 font-medium"
                              : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          By Size
                        </button>
                      </div>
                    </div>

                    {compressionOption === "quality" ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-neutral-800">
                            Image Quality
                          </h3>
                          <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                            {quality}%
                          </span>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm font-medium text-neutral-700">
                            {getQualityLabel(quality)}
                          </span>
                        </div>

                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-2">
                          <span>Smaller file</span>
                          <span>Better quality</span>
                        </div>

                        <p className="mt-4 text-sm text-neutral-600">
                          Higher quality means better image fidelity but larger
                          files. For web use, 70-80% usually offers a good
                          balance.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-neutral-800">
                            Target File Size
                          </h3>
                          <span className="text-sm font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                            {maxSizeInMB} MB
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={maxSizeInMB}
                          onChange={(e) =>
                            setMaxSizeInMB(parseFloat(e.target.value))
                          }
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-2">
                          <span>0.1 MB</span>
                          <span>10 MB</span>
                        </div>

                        <p className="mt-4 text-sm text-neutral-600">
                          Files will be compressed to stay under the specified
                          size limit while maintaining the best possible
                          quality.
                        </p>
                      </div>
                    )}

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex">
                        <FiInfo className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-orange-800">
                            Important Note
                          </h4>
                          <p className="mt-1 text-sm text-orange-700">
                            All processing happens locally in your browser. Your
                            images never leave your device, ensuring complete
                            privacy.
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
            {processedFiles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-neutral-200">
                <FiImage className="mx-auto h-16 w-16 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900">
                  No compressed images yet
                </h3>
                <p className="mt-2 text-neutral-600">
                  Upload and compress some images to see results here
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
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
                        <h2 className="text-2xl font-bold text-neutral-900">
                          Compression Results
                        </h2>
                        <p className="mt-1 text-neutral-600">
                          {processedFiles.length}{" "}
                          {processedFiles.length === 1 ? "image" : "images"}{" "}
                          compressed successfully
                        </p>
                      </div>

                      <div className="mt-4 md:mt-0 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                        <p className="text-green-800 font-medium">
                          Total space saved: {formatFileSize(totalSaved)}
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
                  {processedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                    >
                      <div className="aspect-video bg-neutral-50 relative">
                        <img
                          src={file.compressedPreview}
                          alt={file.originalFile.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="p-4">
                        <h3
                          className="font-medium text-neutral-900 truncate"
                          title={file.originalFile.name}
                        >
                          {file.originalFile.name}
                        </h3>

                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500">Original</p>
                            <p className="text-sm font-medium text-neutral-700">
                              {formatFileSize(file.originalSize)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">
                              Compressed
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              {formatFileSize(file.compressedSize)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center">
                          <div className="flex-1">
                            <p className="text-xs text-neutral-500">
                              Reduction
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              {file.compressionRatio}% smaller
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              downloadFile(
                                file.compressedFile,
                                file.originalFile.name
                              )
                            }
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

export default CompressClient;
