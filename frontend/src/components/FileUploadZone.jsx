import { useState, useRef } from 'react';
import { Spinner } from '@heroui/react';
import { UploadCloud, CheckCircle } from 'lucide-react';

const FileUploadZone = ({
  uploading,
  fileLabel,
  onChange,
  error,
  label = "Bukti Pembayaran *",
  accept = ".svg, .png, .jpg, .jpeg, .gif, image/*",
  multiple = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div 
      className="flex flex-col gap-2 w-full"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {label && <span className="text-xs font-semibold text-default-600">{label}</span>}
      <label
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary bg-primary/20 scale-[1.02]'
            : fileLabel
            ? 'border-primary bg-primary/5 hover:bg-primary/10'
            : 'border-default-300 bg-default-50 hover:bg-default-100 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center pointer-events-none">
          {uploading ? (
            <Spinner size="sm" color="primary" />
          ) : fileLabel ? (
            <>
              <CheckCircle className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium text-primary">
                {fileLabel || 'File berhasil diunggah'}
              </p>
              <p className="text-xs text-primary/70 mt-1">Klik untuk mengganti</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-default-400 mb-2" />
              <p className="text-sm font-medium text-default-700">
                <span className="text-primary font-semibold">Klik untuk upload</span> atau drag and drop
              </p>
              <p className="text-xs text-default-500 mt-1">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={onChange}
          multiple={multiple}
        />
      </label>
      {error && <p className="text-danger text-xs font-medium">{error}</p>}
    </div>
  );
};

export default FileUploadZone;
