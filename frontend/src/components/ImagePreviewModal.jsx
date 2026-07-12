import { useState, useEffect } from 'react';
import { Modal, Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ImagePreviewModal = ({ isOpen, onClose, images = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!images || images.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                  onPress={handlePrev}
                  className="absolute left-2 sm:left-4 z-10 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  aria-label="Gambar sebelumnya"
                >
                  <ChevronLeft size={24} />
                </Button>
              )}

              <img
                src={`${import.meta.env.VITE_API_URL || ''}${images[currentIndex]}`}
                alt={`Preview ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
              />

              {images.length > 1 && (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={handleNext}
                  className="absolute right-2 sm:right-4 z-10 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`relative shrink-0 snap-center w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        i === currentIndex ? 'border-primary scale-110 shadow-lg z-10' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL || ''}${img}`}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default ImagePreviewModal;
