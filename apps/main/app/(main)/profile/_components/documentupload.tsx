"use client"

import { useState, useRef } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, 
    DialogDescription
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { 
    Upload, X, FileText 
} from "lucide-react"
import toast from "@repo/ui/components/ui/sonner";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface DocumentUploadDialogProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (file: File, resumeText?: string) => Promise<void>
    isUploading: boolean
}

const DocumentUploadDialog = ({
    isOpen,
    onClose,
    onUpload,
    isUploading
}: DocumentUploadDialogProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractedText, setExtractedText] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = async (file: File) => {
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a PDF or DOC/DOCX file")
            return
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            toast.error("File is too large. Maximum size is 5MB")
            return
        }

        setSelectedFile(file)

        // Extract text from resume (dynamic import to avoid SSR issues)
        setIsExtracting(true)
        try {
            const { extractTextFromResume } = await import('@/lib/resume-extractor.client')
            const result = await extractTextFromResume(file)
            
            if (result.success && result.text) {
                setExtractedText(result.text)
                toast.success("Resume text extracted successfully!")
            } else {
                toast.warning(`${result.error || 'Could not extract text'}. File will still be uploaded.`)
                setExtractedText(null)
            }
        } catch (error) {
            console.error('Text extraction error:', error)
            toast.warning("Could not extract text from resume. File will still be uploaded.")
            setExtractedText(null)
        } finally {
            setIsExtracting(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const resetState = () => {
        setSelectedFile(null)
        setExtractedText(null)
        setIsExtracting(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const handleUpload = async () => {
        if (selectedFile) {
            await onUpload(selectedFile, extractedText || undefined)
            resetState()
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " bytes"
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
        else return (bytes / 1048576).toFixed(1) + " MB"
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Resume</DialogTitle>
                    <DialogDescription>
                        Upload your resume to showcase your experience and skills
                    </DialogDescription>
                </DialogHeader>
                {
                    !selectedFile ? (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-gray-200"
                                }`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">
                                    {dragActive ? "Drop your file here" : "Drag & drop your file here"}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">or click to browse</p>
                                <p className="text-xs text-gray-400 mb-4">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Browse Files
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mr-4">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium truncate" title={selectedFile.name}>{selectedFile.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setSelectedFile(null)
                                        setExtractedText(null)
                                    }}
                                    disabled={isExtracting}
                                    className="hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            {
                                isExtracting && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                        <InlineLoader size="sm" />
                                        <span>Extracting text from resume...</span>
                                    </div>
                                )
                            }
                            {
                                !isExtracting && extractedText && (
                                    <div className="text-sm text-neutral-800 dark:text-neutral-100">
                                        ✓ Resume text extracted ({extractedText.length} characters)
                                    </div>
                                )
                            }
                        </div>
                    )
                }
                <DialogFooter className="flex sm:justify-between">
                    <Button variant="outline" onClick={handleClose} disabled={isUploading || isExtracting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading || isExtracting}
                        className="ml-2"
                    >
                        {isUploading ? "Uploading..." : isExtracting ? "Extracting..." : "Upload Resume"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DocumentUploadDialog;