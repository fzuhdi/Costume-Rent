import { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, ListBox, Label, TextField } from '@heroui/react';
import { Save } from 'lucide-react';

const ROLES = [
  { key: 'admin', label: 'Admin' },
  { key: 'staff', label: 'Staff' }
];

const UserModal = ({ isOpen, onOpenChange, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        if (item) {
          setFormData({
            name: item.name || '',
            username: item.username || '',
            email: item.email || '',
            password: '', // Leave empty for edit
            role: item.role || 'staff'
          });
        } else {
          setFormData({
            name: '',
            username: '',
            email: '',
            password: '',
            role: 'staff'
          });
        }
        setError(null);
      });
    }
  }, [isOpen, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.role) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!item && !formData.password) {
      setError("Password is required for new users.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Don't send empty password on update
      const dataToSave = { ...formData };
      if (item && !dataToSave.password) {
        delete dataToSave.password;
      }
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  const title = item ? `Edit User` : `Add New User`;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            {(renderProps) => (
              <>
                <Modal.CloseTrigger />
                <Modal.Header className="flex flex-col gap-1">
                  <Modal.Heading className="text-xl font-bold">{title}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
              {error && <div className="text-danger text-sm">{error}</div>}
              <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField isRequired className="w-full">
                  <Label>Name</Label>
                  <Input
                    autoFocus
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </TextField>
                <TextField isRequired className="w-full">
                  <Label>Username</Label>
                  <Input
                    placeholder="Enter unique username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </TextField>
                <TextField isRequired className="w-full">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </TextField>
                <TextField isRequired={!item} className="w-full">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder={item ? "Leave blank to keep current password" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </TextField>
                <Select
                  value={formData.role}
                  onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                >
                  <Label className="text-xs font-semibold mb-1 text-default-600 block">Role *</Label>
                  <Select.Trigger className="w-full flex items-center justify-between bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-default-300 data-[focused]:border-primary rounded-lg px-3 py-2 text-sm text-left shadow-sm">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox className="bg-content1 border border-default-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-1">
                      {ROLES.map((role) => (
                        <ListBox.Item key={role.key} id={role.key} textValue={role.label} className="px-3 py-2 hover:bg-default-100 cursor-pointer rounded-md text-sm outline-none data-[focused]:bg-default-100">
                          {role.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </form>
                </Modal.Body>
                <Modal.Footer>
                  <Button color="danger" variant="flat" onPress={() => renderProps.close()} disabled={saving}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" form="user-form" isLoading={saving}>
                    <Save size={18} className="mr-2" /> Save
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default UserModal;
