import { useState, useEffect } from 'react';
import { Button, Table, Spinner, Chip } from '@heroui/react';
import { Plus, Edit2, Trash2, UserCog } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/userApi';
import UserModal from '@/components/UserModal';
import { useAuth } from '@/context/AuthContext';

const UserManagementTab = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onOpenChange = (open) => setIsOpen(open);
  
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchUsers(false));
  }, []);

  const handleAdd = () => {
    setSelectedUser(null);
    onOpen();
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || "Gagal menghapus pengguna";
      alert(msg);
    }
  };

  const handleSave = async (data) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, data);
      } else {
        await createUser(data);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      throw err; // Re-throw so modal can catch and display error
    }
  };

  const renderRoleChip = (role) => {
    const isOwner = role === 'admin';
    return (
      <Chip
        size="sm"
        color={isOwner ? "secondary" : "default"}
        variant={isOwner ? "flat" : "bordered"}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Chip>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="text-danger">{error}</div>}

      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCog size={22} className="text-[var(--primary)]" />
            User Management
          </h2>
          <p className="text-sm text-[var(--muted)]">Kelola akun admin dan staff</p>
        </div>
        <Button color="primary" onPress={handleAdd} startContent={<Plus size={16} />}>
          Add User
        </Button>
      </div>
      
      <Table aria-label="Users Table" shadow="sm">
        <Table.ScrollContainer>
          <Table.Content aria-label="Users Table Content">
            <Table.Header>
              <Table.Column isRowHeader>ID</Table.Column>
              <Table.Column>NAME</Table.Column>
              <Table.Column>USERNAME</Table.Column>
              <Table.Column>EMAIL</Table.Column>
              <Table.Column>ROLE</Table.Column>
              <Table.Column align="center">ACTIONS</Table.Column>
            </Table.Header>
            <Table.Body renderEmptyState={() => (
              <div className="flex w-full items-center justify-center p-4">
                {loading ? <Spinner /> : "No users found."}
              </div>
            )}>
              {users.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{item.id}</Table.Cell>
                  <Table.Cell className="font-semibold">{item.name}</Table.Cell>
                  <Table.Cell className="text-[var(--muted)]">@{item.username}</Table.Cell>
                  <Table.Cell>{item.email}</Table.Cell>
                  <Table.Cell>{renderRoleChip(item.role)}</Table.Cell>
                  <Table.Cell className="flex justify-end gap-2">
                    <Button 
                      isIconOnly 
                      size="sm" 
                      variant="light" 
                      onPress={() => handleEdit(item)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      color="danger" 
                      variant="light" 
                      onPress={() => handleDelete(item.id)}
                      isDisabled={currentUser?.id === item.id} // Prevent self-deletion
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <UserModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        onSave={handleSave}
        item={selectedUser}
      />
    </div>
  );
};

export default UserManagementTab;
