import { Button } from '@heroui/react';
import { X } from 'lucide-react';
import FileUploadZone from './FileUploadZone';

const CostumeImageManager = ({ images, stagedFiles, onFileSelect, onRemoveExisting, onRemoveStaged }) => {
  return (
    <div>
      <FileUploadZone
        uploading={false}
        fileLabel={stagedFiles.length > 0 ? `${stagedFiles.length} file dipilih` : null}
        onChange={onFileSelect}
        label="Gambar Kostum"
        multiple={true}
      />
      {(images.length > 0 || stagedFiles.length > 0) && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {images.map((img) => (
            <div key={`existing-${img.id}`} className="relative w-20 h-20 group">
              <img src={img.path} alt="Costume" className="w-full h-full object-cover rounded" />
              <Button
                isIconOnly
                size="sm"
                radius="full"
                onPress={() => onRemoveExisting(img.id)}
                className="absolute -top-2 -right-2 w-6 h-6 min-w-6 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
          {stagedFiles.map((staged) => (
            <div key={`staged-${staged.id}`} className="relative w-20 h-20 group">
              <img src={staged.previewUrl} alt="Staged" className="w-full h-full object-cover rounded" />
              <Button
                isIconOnly
                size="sm"
                radius="full"
                onPress={() => onRemoveStaged(staged.id)}
                className="absolute -top-2 -right-2 w-6 h-6 min-w-6 bg-red-500 text-white opacity-80 hover:opacity-100"
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

export default CostumeImageManager;
