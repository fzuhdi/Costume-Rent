import { useState, useEffect } from 'react';
import { Modal, Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
const ImagePreviewModal = ({ isOpen, onClose, images = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog aria-label="Pratinjau Gambar" className="max-w-4xl bg-transparent shadow-none w-full border-none">
          <div className="relative flex flex-col items-center justify-center w-full min-h-[50vh] sm:min-h-[80vh] outline-none">
            
            {/* Close Button */}
            <Button
              isIconOnly
              variant="flat"
              onPress={onClose}
              className="absolute -top-4 right-0 sm:-right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
              aria-label="Tutup preview gambar"
            >
              <X size={20} />
            </Button>

            {/* Main Image View */}
            <div className="relative w-full flex items-center justify-center group h-[60vh] sm:h-[70vh]">
              
              {images.length > 1 && (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 sm:-left-12 z-20 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Gambar sebelumnya"
                >
                  <ChevronLeft size={24} />
                </Button>
              )}

              {/* Current Image */}
              <img
                src={images[currentIndex].startsWith('http') ? images[currentIndex] : `${import.meta.env.VITE_API_URL || ''}${images[currentIndex]}`}
                alt={`Preview ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
              />

              {images.length > 1 && (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 sm:-right-12 z-20 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Gambar selanjutnya"
                >
                  <ChevronRight size={24} />
                </Button>
              )}
            </div>

            {/* Thumbnail Strip / Indicator */}
            {images.length > 1 && (
              <div className="mt-4 flex flex-col items-center gap-3 w-full bg-black/40 backdrop-blur-md p-3 rounded-xl max-w-2xl mx-auto">
                <span className="text-white text-xs font-medium">
                  Receipt {currentIndex + 1} dari {images.length}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full px-2 snap-x">
                  {images.map((img, i) => (
                    <Button
                      isIconOnly
                      key={img}
                      onPress={() => setCurrentIndex(i)}
                      radius="none"
                      className={`relative shrink-0 snap-center min-w-0 w-16 h-16 p-0 rounded-md overflow-hidden border-2 transition-all bg-transparent ${
                        i === currentIndex ? 'border-primary scale-110 shadow-lg z-10' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL || ''}${img}`}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ImagePreviewModal;
