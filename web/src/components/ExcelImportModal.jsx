import { useState, useRef } from 'react';
import {
  Modal,
  Button,
  ProgressBar,
  toast
} from "@heroui/react";
import { Download, UploadCloud, FileSpreadsheet, Trash2 } from "lucide-react";
import { getErrorMessage } from '@/utils/errorMap';

const handleDragOver = (e) => {
  e.preventDefault();
};

const ExcelImportModal = ({
  isOpen,
  onOpenChange,
  title,
  templateUrl,
  uploadUrl,
  onSuccess
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const isExcel = selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile.type === "application/vnd.ms-excel" ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls');

    if (!isExcel) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size should not exceed 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');

    fetch(templateUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to download template');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const filename = title.toLowerCase().includes('client') ? 'clients_template.xlsx' :
          title.toLowerCase().includes('rent') ? 'rents_template.xlsx' : 'catalogue_template.xlsx';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        toast.error('Failed to download template');
      });
  };

  const handleUpload = async (onClose) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = getErrorMessage({ response: { data } });
        throw new Error(errMsg || 'Failed to import data');
      }

      toast.success(data.message || 'Data imported successfully!');
      if (onSuccess) onSuccess();
      setFile(null);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    if (!isUploading) {
      setFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) closeModal(); else onOpenChange(open); }}>
      <Button className="hidden">Hidden Trigger</Button>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-2xl bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-6">

              {/* Step 1 */}
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center bg-primary text-white w-6 h-6 rounded-full text-sm">1</span>
                  Download Template
                </h3>
                <p className="text-sm text-default-500 ml-8">
                  Please use our standard Excel template to ensure your data is formatted correctly before uploading.
                </p>
                <div className="ml-8 mt-2">
                  <Button
                    onPress={handleDownloadTemplate}
                    variant="flat"
                    color="primary"
                    isDisabled={isUploading}
                  >
                    <Download size={18} /> Download
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center bg-primary text-white w-6 h-6 rounded-full text-sm">2</span>
                  Upload Data
                </h3>
                <p className="text-sm text-default-500 ml-8">
                  Fill the template and upload it back here. Make sure not to change the column headers.
                </p>

                <div className="ml-8 mt-2">
                  {!file ? (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
                          ${isDragging ? 'border-primary bg-primary/5' : 'border-default-300 hover:border-primary/50 bg-default-50/50'}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
                        <UploadCloud size={28} />
                      </div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-default-400 mt-2">Supports .xlsx, .xls up to 5MB</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="border border-default-200 rounded-xl p-4 flex items-center justify-between bg-default-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-success/10 text-success rounded-lg">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-default-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      {!isUploading && (
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          size="sm"
                          onPress={() => setFile(null)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-default-500">
                        <span>Uploading & Validating Data...</span>
                      </div>
                      <ProgressBar
                        size="sm"
                        isIndeterminate
                        color="primary"
                        aria-label="Uploading"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button color="danger" variant="light" onPress={closeModal} isDisabled={isUploading}>
              Cancel
            </Button>
            <Button color="primary" onPress={() => handleUpload(closeModal)} isDisabled={!file || isUploading} isLoading={isUploading}>
              Import Data
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ExcelImportModal;
