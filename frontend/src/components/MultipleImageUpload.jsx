import { Button } from '@heroui/react';
import { X } from 'lucide-react';
import FileUploadZone from './FileUploadZone';

const MultipleImageUpload = ({ 
  label = "Upload Gambar", 
  files, 
  onFilesChange,
  existingFiles = [],
  onRemoveExisting = null
}) => {
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleRemove = (idToRemove) => {
    const updatedFiles = files.filter(f => f.id !== idToRemove);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="w-full">
      <FileUploadZone
        uploading={false}
        fileLabel={files.length > 0 ? `${files.length} file baru dipilih` : null}
        onChange={handleFileSelect}
        label={label}
        multiple={true}
      />
      {(files.length > 0 || existingFiles.length > 0) && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {existingFiles.map((img) => (
            <div key={`existing-${img.id || img.path}`} className="relative w-20 h-20 group">
              <img src={img.path || img} alt="Preview" className="w-full h-full object-cover rounded-md border border-default-200" />
              {onRemoveExisting && (
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  onPress={() => onRemoveExisting(img.id || img)}
                  className="absolute -top-2 -right-2 w-6 h-6 min-w-6 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          ))}

          {files.map((fileObj) => (
            <div key={fileObj.id} className="relative w-20 h-20 group">
              <img src={fileObj.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md border border-default-200" />
              <Button
                isIconOnly
                size="sm"
                radius="full"
                onPress={() => handleRemove(fileObj.id)}
                className="absolute -top-2 -right-2 w-6 h-6 min-w-6 bg-red-500 text-white opacity-80 hover:opacity-100 z-10"
                aria-label="Remove image"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
