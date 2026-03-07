import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  label: string;
  description: string;
  acceptedFormats: string;
  icon: React.ReactNode;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  optional?: boolean;
  multiple?: boolean;
  files?: File[];
  onFilesSelect?: (files: File[]) => void;
}

const FileUploadZone = ({
  label,
  description,
  acceptedFormats,
  icon,
  file,
  onFileSelect,
  optional,
  multiple,
  files,
  onFilesSelect,
}: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const hasFile = multiple ? (files && files.length > 0) : !!file;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (multiple && onFilesSelect) {
        onFilesSelect(droppedFiles);
      } else if (droppedFiles[0]) {
        onFileSelect(droppedFiles[0]);
      }
    },
    [multiple, onFileSelect, onFilesSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple && onFilesSelect) {
      onFilesSelect(selectedFiles);
    } else if (selectedFiles[0]) {
      onFileSelect(selectedFiles[0]);
    }
  };

  const clearFiles = () => {
    if (multiple && onFilesSelect) {
      onFilesSelect([]);
    } else {
      onFileSelect(null);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-5 transition-all cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/5 glow-cyan-sm"
          : hasFile
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:border-primary/30 hover:bg-secondary/30"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        accept={acceptedFormats}
        onChange={handleInputChange}
        multiple={multiple}
      />

      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2.5 rounded-md",
          hasFile ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-primary/60"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {label}
            </span>
            {optional && (
              <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                OPTIONAL
              </span>
            )}
          </div>
          {hasFile ? (
            <div className="mt-1.5">
              {multiple && files ? (
                <p className="text-xs text-primary font-mono">
                  {files.length} file{files.length !== 1 ? 's' : ''} loaded
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-primary" />
                  <p className="text-xs text-primary font-mono truncate">
                    {file?.name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                {acceptedFormats}
              </p>
            </>
          )}
        </div>
        {hasFile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive z-20 relative"
            onClick={(e) => {
              e.stopPropagation();
              clearFiles();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
