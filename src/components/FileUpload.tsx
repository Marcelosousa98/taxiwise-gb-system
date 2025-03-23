
import React, { useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  className?: string;
  preview?: boolean;
}

export const FileUpload = ({
  id,
  label,
  accept = "image/*",
  multiple = false,
  onChange,
  className,
  preview = true
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(multiple ? [...files, ...selectedFiles] : selectedFiles);
      
      // Create previews for images
      if (preview) {
        const newPreviews = selectedFiles.map(file => {
          if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
          }
          return '';
        });
        
        setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
      }
      
      onChange(multiple ? [...files, ...selectedFiles] : selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    if (preview) {
      const newPreviews = [...previews];
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
      }
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
    }
    
    onChange(newFiles);
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors duration-200",
          "flex flex-col items-center justify-center text-center",
          "hover:border-primary/60 hover:bg-primary/5",
          "focus-within:border-primary/60 focus-within:bg-primary/5"
        )}
      >
        <input
          type="file"
          id={id}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="sr-only"
        />
        
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <label 
              htmlFor={id}
              className="text-sm font-medium cursor-pointer text-primary hover:text-primary/70"
            >
              Clique para upload
            </label>
            <p className="text-xs text-muted-foreground">
              {multiple ? 'Arraste os arquivos ou clique para selecionar' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div key={index} className="relative rounded-lg border overflow-hidden">
              <div className="flex items-start p-3">
                <div className="flex-shrink-0 mr-3">
                  {isImage(file) && preview ? (
                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden">
                      {previews[index] && (
                        <img 
                          src={previews[index]} 
                          alt="Preview" 
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                      {isImage(file) ? (
                        <Image className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                
                <button
                  type="button"
                  className="flex-shrink-0 ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {isImage(file) && preview && previews[index] && (
                <div className="p-3 pt-0">
                  <div className="rounded overflow-hidden max-h-48">
                    <img 
                      src={previews[index]} 
                      alt="Preview" 
                      className="w-full object-contain" 
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
