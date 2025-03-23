
import React, { useState } from 'react';
import { Upload, X, FileText, Image, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[], urls?: string[]) => void;
  className?: string;
  preview?: boolean;
  bucket?: string;
  folder?: string;
  onUploadComplete?: (urls: string[], fileNames: string[]) => void;
  existingUrls?: string[];
}

export const FileUpload = ({
  id,
  label,
  accept = "image/*",
  multiple = false,
  onChange,
  className,
  preview = true,
  bucket,
  folder = '',
  onUploadComplete,
  existingUrls = []
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingUrls);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Upload to Supabase if bucket is specified
      if (bucket) {
        await uploadToSupabase(multiple ? [...files, ...selectedFiles] : selectedFiles);
      }
    }
  };

  const uploadToSupabase = async (filesToUpload: File[]) => {
    if (!bucket) return;
    
    setIsUploading(true);
    const urls: string[] = [];
    const fileNames: string[] = [];
    
    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
          
        urls.push(urlData.publicUrl);
        fileNames.push(file.name);
      }
      
      setUploadedUrls(multiple ? [...uploadedUrls, ...urls] : urls);
      
      if (onUploadComplete) {
        onUploadComplete(urls, fileNames);
      }
      
      toast.success('Arquivo(s) enviado(s) com sucesso!');
    } catch (error: any) {
      console.error("Erro ao enviar arquivo:", error);
      toast.error(`Erro ao enviar: ${error.message || 'Falha no upload'}`);
    } finally {
      setIsUploading(false);
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
    
    // Also remove from uploaded URLs if any
    if (bucket && uploadedUrls.length > index) {
      const newUrls = [...uploadedUrls];
      newUrls.splice(index, 1);
      setUploadedUrls(newUrls);
    }
    
    onChange(newFiles, uploadedUrls);
  };

  const isImage = (file: File) => file.type.startsWith('image/');
  const isPDF = (file: File) => file.type === 'application/pdf';

  const getFileTypeIcon = (file: File) => {
    if (isImage(file)) return <Image className="h-5 w-5 text-primary" />;
    if (isPDF(file)) return <FileText className="h-5 w-5 text-primary" />;
    return <FileIcon className="h-5 w-5 text-primary" />;
  };

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
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <label 
              htmlFor={id}
              className={cn(
                "text-sm font-medium cursor-pointer text-primary hover:text-primary/70",
                isUploading && "pointer-events-none opacity-70"
              )}
            >
              {isUploading ? 'Enviando...' : 'Clique para upload'}
            </label>
            <p className="text-xs text-muted-foreground">
              {multiple ? 'Arraste os arquivos ou clique para selecionar' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            {accept === "application/pdf" && (
              <Badge variant="outline" className="mx-auto mt-1">Somente PDF</Badge>
            )}
          </div>
        </div>
      </div>

      {(files.length > 0 || uploadedUrls.length > 0) && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div key={`file-${index}`} className="relative rounded-lg border overflow-hidden">
              <div className="flex items-start p-3">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden">
                    {isImage(file) && preview && previews[index] ? (
                      <img 
                        src={previews[index]} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      getFileTypeIcon(file)
                    )}
                  </div>
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
                  disabled={isUploading}
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
              
              {isPDF(file) && (
                <div className="p-3 pt-0">
                  <div className="flex items-center justify-center p-4 bg-muted rounded">
                    <FileText className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm">Documento PDF</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Display existing files from URLs */}
          {uploadedUrls.filter(url => !files.some((_, i) => uploadedUrls[i] === url)).map((url, index) => (
            <div key={`url-${index}`} className="relative rounded-lg border overflow-hidden">
              <div className="flex items-start p-3">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden">
                    {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img 
                        src={url} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                      />
                    ) : url.match(/\.pdf$/i) ? (
                      <FileText className="h-5 w-5 text-primary" />
                    ) : (
                      <FileIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {url.split('/').pop() || 'Arquivo'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Arquivo enviado
                  </p>
                </div>
                
                <button
                  type="button"
                  className="flex-shrink-0 ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => {
                    const newUrls = [...uploadedUrls];
                    newUrls.splice(index, 1);
                    setUploadedUrls(newUrls);
                    onChange(files, newUrls);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {url.match(/\.(jpeg|jpg|gif|png)$/i) && preview && (
                <div className="p-3 pt-0">
                  <div className="rounded overflow-hidden max-h-48">
                    <img 
                      src={url} 
                      alt="Preview" 
                      className="w-full object-contain" 
                    />
                  </div>
                </div>
              )}
              
              {url.match(/\.pdf$/i) && (
                <div className="p-3 pt-0">
                  <div className="flex items-center justify-center p-4 bg-muted rounded">
                    <FileText className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver documento PDF
                      </a>
                    </span>
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

