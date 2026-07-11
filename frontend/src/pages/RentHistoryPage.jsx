import { useReducer, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRents, markReturned, deleteRent } from '../api/rentApi';
import {
  Input, Button, Select, ListBox, Label,
  Spinner, Modal, Card, Separator
} from '@heroui/react';
import CustomPagination from '../components/CustomPagination';
import RentHistoryTable from '../components/RentHistoryTable';
import RentReturnModal from '../components/RentReturnModal';

const initialState = {
  rents: [],
  loading: true,
  search: '',
  debouncedSearch: '',
  statusFilter: '',
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0,
  isReturnOpen: false,
  isDeleteOpen: false,
  selectedRentId: null,
  actionLoading: false,
  idReturned: false,
  isGoodCondition: true,
  damageFee: ''
};

function rentReducer(state, action) {
  switch (action.type) {
    case 'SET_RENTS':
      return { ...state, rents: action.payload.rents, totalPages: action.payload.totalPages, total: action.payload.total, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 };
    case 'SET_DEBOUNCED_SEARCH':
      return { ...state, debouncedSearch: action.payload };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_LIMIT':
      return { ...state, limit: action.payload, page: 1 };
    case 'OPEN_RETURN_MODAL':
      return { ...state, isReturnOpen: true, selectedRentId: action.payload, idReturned: false, isGoodCondition: true, damageFee: '' };
    case 'CLOSE_RETURN_MODAL':
      return { ...state, isReturnOpen: false, selectedRentId: null };
    case 'OPEN_DELETE_MODAL':
      return { ...state, isDeleteOpen: true, selectedRentId: action.payload };
    case 'CLOSE_DELETE_MODAL':
      return { ...state, isDeleteOpen: false, selectedRentId: null };
    case 'SET_ACTION_LOADING':
      return { ...state, actionLoading: action.payload };
    case 'UPDATE_RETURN_FORM':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const RentHistoryPage = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(rentReducer, initialState);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_SEARCH', payload: state.search });
    }, 300);
    return () => clearTimeout(timer);
  }, [state.search]);

  const fetchRents = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const isSearching = Boolean(state.debouncedSearch.trim());
      const response = await getRents({
        search: '',
        status: state.statusFilter,
        page: isSearching ? 1 : state.page,
        limit: isSearching ? 100 : state.limit,
      });
      const data = response.data.data || [];
      const filteredData = isSearching
        ? data.filter((rent) => rent.client_name?.toLowerCase().includes(state.debouncedSearch.trim().toLowerCase()))
        : data;
      dispatch({
        type: 'SET_RENTS',
        payload: {
          rents: filteredData,
          totalPages: isSearching ? 1 : response.data.total_pages || 1,
          total: isSearching ? filteredData.length : response.data.total || 0,
        }
      });
    } catch (error) {
      console.error('Failed to fetch rents:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.debouncedSearch, state.statusFilter, state.page, state.limit]);

  useEffect(() => {
    fetchRents();
  }, [fetchRents]);

  const handleMarkReturned = async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      const payload = {
        damage_fee: state.isGoodCondition ? 0 : (parseInt(state.damageFee) || 0)
      };
      await markReturned(state.selectedRentId, payload);
      dispatch({ type: 'CLOSE_RETURN_MODAL' });
      fetchRents();
    } catch (error) {
      console.error('Failed to mark returned:', error);
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  };

  const handleDelete = async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      await deleteRent(state.selectedRentId);
      dispatch({ type: 'CLOSE_DELETE_MODAL' });
      fetchRents();
    } catch (error) {
      console.error('Failed to delete rent:', error);
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  };

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Riwayat Peminjaman</h1>
          <Button
            onPress={() => navigate('/pos')}
            variant="primary"
            aria-label="Peminjaman Baru via POS"
          >
            Peminjaman Baru (POS)
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <Input
            placeholder="Cari klien..."
            value={state.search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            aria-label="Cari klien"
            className="w-full sm:w-64"
          />
          <Select
            placeholder="Semua Status"
            value={state.statusFilter || null}
            onChange={(key) => dispatch({ type: 'SET_STATUS_FILTER', payload: key ? String(key) : '' })}
            className="w-full sm:w-40"
          >
            <Label className="sr-only">Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="" textValue="Semua Status">Semua Status<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="active" textValue="Aktif">Aktif<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="returned" textValue="Dikembalikan">Dikembalikan<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="overdue" textValue="Terlambat">Terlambat<ListBox.ItemIndicator /></ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <Separator />
      </Card.Header>

      <Card.Content>
        {state.loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : state.rents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada peminjaman</h3>
            <p className="text-sm text-[var(--muted)]">Belum ada data peminjaman</p>
          </div>
        ) : (
          <RentHistoryTable 
            rents={state.rents} 
            openReturnModal={(id) => dispatch({ type: 'OPEN_RETURN_MODAL', payload: id })} 
          />
        )}
      </Card.Content>

      <Card.Footer>
        <CustomPagination
          total={state.total}
          page={state.page}
          limit={state.limit}
          onPageChange={(p) => dispatch({ type: 'SET_PAGE', payload: p })}
          onLimitChange={(l) => dispatch({ type: 'SET_LIMIT', payload: l })}
        />
      </Card.Footer>

      <RentReturnModal
        isOpen={state.isReturnOpen}
        onClose={() => dispatch({ type: 'CLOSE_RETURN_MODAL' })}
        onConfirm={handleMarkReturned}
        idReturned={state.idReturned}
        setIdReturned={(val) => dispatch({ type: 'UPDATE_RETURN_FORM', payload: { idReturned: val } })}
        isGoodCondition={state.isGoodCondition}
        setIsGoodCondition={(val) => dispatch({ type: 'UPDATE_RETURN_FORM', payload: { isGoodCondition: val } })}
        damageFee={state.damageFee}
        setDamageFee={(val) => dispatch({ type: 'UPDATE_RETURN_FORM', payload: { damageFee: val } })}
        actionLoading={state.actionLoading}
      />

      <Modal.Backdrop isOpen={state.isDeleteOpen} onOpenChange={() => dispatch({ type: 'CLOSE_DELETE_MODAL' })}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi</Modal.Heading>
            </Modal.Header>
            <Modal.Body>Hapus peminjaman ini?</Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => dispatch({ type: 'CLOSE_DELETE_MODAL' })} aria-label="Batal">Batal</Button>
              <Button variant="danger" onPress={handleDelete} isPending={state.actionLoading} aria-label="Hapus peminjaman">Hapus</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
};

export default RentHistoryPage;
