import { useState, useEffect } from 'react';
import { Button, Table, useOverlayState, Spinner } from '@heroui/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getRegions, createRegion, updateRegion, deleteRegion, getCategories, createCategory, updateCategory, deleteCategory } from '../api/costumeApi';
import MasterDataModal from './MasterDataModal';

const MasterDataTab = () => {
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const modalState = useOverlayState();
  const [modalType, setModalType] = useState('Region'); // 'Region' or 'Category'
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchRegions = async () => {
    try {
      setLoadingRegions(true);
      const res = await getRegions();
      setRegions(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat regions");
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await getCategories();
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchCategories();
  }, []);

  const handleAdd = (type) => {
    setModalType(type);
    setSelectedItem(null);
    modalState.open();
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    modalState.open();
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'Region') {
        await deleteRegion(id);
        fetchRegions();
      } else {
        await deleteCategory(id);
        fetchCategories();
      }
    } catch (err) {
      const msg = err.response?.data?.error || `Gagal menghapus ${type}`;
      alert(msg); // Replace with toast later
    }
  };

  const handleSave = async (data) => {
    try {
      if (modalType === 'Region') {
        if (selectedItem) {
          await updateRegion(selectedItem.id, data);
        } else {
          await createRegion(data);
        }
        fetchRegions();
      } else {
        if (selectedItem) {
          await updateCategory(selectedItem.id, data);
        } else {
          await createCategory(data);
        }
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
      throw err; // So modal doesn't close
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <div className="text-danger">{error}</div>}

      {/* Regions Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Regions Management</h2>
          <Button color="primary" onPress={() => handleAdd('Region')} startContent={<Plus size={16} />}>
            Add Region
          </Button>
        </div>
        
        <Table aria-label="Regions Table" shadow="sm">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>ID</Table.Column>
                <Table.Column>NAME</Table.Column>
                <Table.Column align="center">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {regions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={3} className="text-center py-4">
                      {loadingRegions ? <Spinner /> : "No regions found."}
                    </Table.Cell>
                    <Table.Cell className="hidden"></Table.Cell>
                    <Table.Cell className="hidden"></Table.Cell>
                  </Table.Row>
                ) : (
                  regions.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>{item.id}</Table.Cell>
                      <Table.Cell>{item.name}</Table.Cell>
                      <Table.Cell className="flex justify-end gap-2">
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit('Region', item)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDelete('Region', item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Categories Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Categories Management</h2>
          <Button color="primary" onPress={() => handleAdd('Category')} startContent={<Plus size={16} />}>
            Add Category
          </Button>
        </div>
        
        <Table aria-label="Categories Table" shadow="sm">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>ID</Table.Column>
                <Table.Column>NAME</Table.Column>
                <Table.Column align="center">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {categories.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={3} className="text-center py-4">
                      {loadingCategories ? <Spinner /> : "No categories found."}
                    </Table.Cell>
                    <Table.Cell className="hidden"></Table.Cell>
                    <Table.Cell className="hidden"></Table.Cell>
                  </Table.Row>
                ) : (
                  categories.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>{item.id}</Table.Cell>
                      <Table.Cell>{item.name}</Table.Cell>
                      <Table.Cell className="flex justify-end gap-2">
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit('Category', item)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDelete('Category', item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <MasterDataModal
        isOpen={modalState.isOpen}
        onOpenChange={modalState.setOpen}
        onClose={modalState.close}
        onSave={handleSave}
        item={selectedItem}
        type={modalType}
      />
    </div>
  );
};

export default MasterDataTab;
