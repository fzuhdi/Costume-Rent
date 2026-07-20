import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@heroui/react';
import { Save } from 'lucide-react';

const MasterDataModal = ({ isOpen, onClose, onSave, item, type }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(item ? item.name : '');
    }
  }, [isOpen, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({ name });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const title = item ? `Edit ${type}` : `Add New ${type}`;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <Modal.Content>
        <Modal.Header className="flex flex-col gap-1">{title}</Modal.Header>
        <Modal.Body>
          <form id="master-data-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              autoFocus
              label={`${type} Name`}
              placeholder={`Enter ${type.toLowerCase()} name`}
              variant="bordered"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
            />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button color="danger" variant="flat" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button color="primary" type="submit" form="master-data-form" isLoading={saving}>
            <Save size={18} className="mr-2" /> Save
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default MasterDataModal;
