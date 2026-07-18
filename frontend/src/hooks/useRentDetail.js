import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRentById, cancelRent, deleteRent, updateRent, rollbackOrder } from '../api/rentApi';
import { updateClient } from '../api/clientApi';

export function useRentDetail(id, navigate, formatDate) {
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit States
  const [editData, setEditData] = useState({});
  const [editItems, setEditItems] = useState([]);

  // Image Preview States
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (images, index) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const fetchRent = useCallback(async () => {
    try {
      const response = await getRentById(id);
      setRent(response.data);
    } catch (error) {
      console.error('Failed to fetch rent:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRent();
  }, [fetchRent]);

  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    setEditData({
      client: {
        type: 'existing',
        client: rent.client,
        name: rent.client?.name || rent.client_name,
      },
      client_phone: rent.client?.phone || rent.client_phone || '',
      client_address: rent.client?.address || rent.client_address || '',
      event_date: rent.event_date ? rent.event_date.split('T')[0] : '',
      guarantee_type: rent.guarantee_type || 'KTP',
      notes: rent.notes || '',
    });
    setEditItems(rent.items.map(i => ({ ...i, custom_rental_fee: i.rental_fee })));
    setIsEditing(true);
  };

  const openRentModal = () => setActiveModal('rent');
  const openReturnModal = () => setActiveModal('return');
  const openUpgradeModal = () => setActiveModal('upgrade');

  const handleEditSave = async () => {
    setProcessing(true);
    try {
      const payload = { ...editData };
      if (editData.client?.type === 'existing' && editData.client.client.id !== rent.client_id) {
        payload.client_id = editData.client.client.id;
        if (editData.client_phone !== editData.client.client.phone || editData.client_address !== editData.client.client.address) {
          await updateClient(editData.client.client.id, {
            name: editData.client.client.name,
            phone: editData.client_phone,
            address: editData.client_address
          });
        }
      } else if (editData.client?.type === 'new') {
        payload.client_name = editData.client.name;
        payload.client_phone = editData.client_phone;
        payload.client_address = editData.client_address;
      } else if (editData.client?.type === 'existing' && editData.client.client.id === rent.client_id) {
        if (editData.client_phone !== rent.client_phone || editData.client_address !== rent.client_address) {
          await updateClient(rent.client_id, {
            name: rent.client?.name || rent.client_name,
            phone: editData.client_phone,
            address: editData.client_address
          });
        }
      }

      delete payload.client;
      delete payload.client_name;
      delete payload.client_phone;
      delete payload.client_address;

      payload.early_takeaway_fee = payload.early_takeaway_fee === '' ? 0 : payload.early_takeaway_fee;
      payload.late_fee = payload.late_fee === '' ? 0 : payload.late_fee;
      payload.damage_fee = payload.damage_fee === '' ? 0 : payload.damage_fee;
      payload.extension_fee = payload.extension_fee === '' ? 0 : payload.extension_fee;

      payload.items = editItems.map(i => ({
        costume_id: i.costume_id,
        quantity: i.quantity,
        custom_rental_fee: Number(i.custom_rental_fee)
      }));
      await updateRent(id, payload);
      setIsEditing(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to update rent:', error);
      alert(error.response?.data?.error || 'Gagal update pesanan');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await cancelRent(id);
      await fetchRent();
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRollback = async () => {
    setProcessing(true);
    try {
      await rollbackOrder(id);
      await fetchRent();
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to rollback:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await deleteRent(id);
      setActiveModal(null);
      navigate('/rents');
    } catch (error) {
      console.error('Failed to delete rent:', error);
    } finally {
      setProcessing(false);
    }
  };

  const groupedLogs = useMemo(() => {
    if (!rent || !rent.activity_logs) return [];
    const groups = [];
    let currentGroup = null;

    rent.activity_logs.forEach(log => {
      const exactTime = log.created_at;
      if (!currentGroup || currentGroup.timestamp !== exactTime) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          timestamp: exactTime,
          logs: []
        };
      }
      currentGroup.logs.push(log);
    });
    if (currentGroup) groups.push(currentGroup);
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rent, formatDate]);

  const renderLogContent = useCallback((log) => {
    if (log.action_type === 'UPDATED' && (log.new_value === 'updated' || !log.old_value)) {
      return 'Order details were updated';
    }
    if (log.old_value && log.new_value) {
      return `${log.old_value} ➞ ${log.new_value}`;
    }
    return log.new_value || log.old_value;
  }, []);

  return {
    rent, loading, processing,
    activeModal, setActiveModal,
    isEditing, setIsEditing,
    editData, setEditData,
    editItems, setEditItems,
    previewImages, previewIndex,
    isPreviewOpen, setIsPreviewOpen,
    openPreview, fetchRent, toggleEditMode,
    openRentModal, openReturnModal, openUpgradeModal,
    handleEditSave, handleCancel, handleRollback, handleDelete,
    groupedLogs, renderLogContent
  };
}
