import { useReducer, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRents, markReturned, markRented, cancelRent } from '../api/rentApi';
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
  isRentOpen: false,
  isCancelOpen: false,
  selectedRentId: null,
  selectedRentData: null,
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
    case 'OPEN_RENT_MODAL': {
      const rentData = state.rents.find(r => r.id === action.payload);
      return { ...state, isRentOpen: true, selectedRentId: action.payload, selectedRentData: rentData || null };
    }
    case 'CLOSE_RENT_MODAL':
      return { ...state, isRentOpen: false, selectedRentId: null, selectedRentData: null };
    case 'OPEN_CANCEL_MODAL': {
      const rentData = state.rents.find(r => r.id === action.payload);
      return { ...state, isCancelOpen: true, selectedRentId: action.payload, selectedRentData: rentData || null };
    }
    case 'CLOSE_CANCEL_MODAL':
      return { ...state, isCancelOpen: false, selectedRentId: null, selectedRentData: null };
    case 'SET_ACTION_LOADING':
      return { ...state, actionLoading: action.payload };
    case 'UPDATE_RETURN_FORM':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

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

  const handleMarkRented = async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      await markRented(state.selectedRentId);
      dispatch({ type: 'CLOSE_RENT_MODAL' });
      fetchRents();
    } catch (error) {
      console.error('Failed to mark rented:', error);
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  };

  const handleCancel = async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      await cancelRent(state.selectedRentId);
      dispatch({ type: 'CLOSE_CANCEL_MODAL' });
      fetchRents();
    } catch (error) {
      console.error('Failed to cancel rent:', error);
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  };

  // Calculate remaining balance for the selected rent
  const getRemainingBalance = () => {
    const rent = state.selectedRentData;
    if (!rent) return 0;
    const totalFee = rent.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;
    return Math.max(0, totalFee - (rent.downpayment || 0));
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
                <ListBox.Item id="draft" textValue="Draft">Draft<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="booked" textValue="Dipesan">Dipesan<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="rented" textValue="Disewa">Disewa<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="returned" textValue="Dikembalikan">Dikembalikan<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="overdue" textValue="Terlambat">Terlambat<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="cancelled" textValue="Dibatalkan">Dibatalkan<ListBox.ItemIndicator /></ListBox.Item>
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
            openRentModal={(id) => dispatch({ type: 'OPEN_RENT_MODAL', payload: id })}
            openCancelModal={(id) => dispatch({ type: 'OPEN_CANCEL_MODAL', payload: id })}
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

      {/* Mark Rented Confirmation Modal */}
      <Modal.Backdrop isOpen={state.isRentOpen} onOpenChange={() => dispatch({ type: 'CLOSE_RENT_MODAL' })}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi Penyewaan</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3">
                <p>Konfirmasi pembayaran dan serahkan kostum ke klien?</p>
                {state.selectedRentData && (
                  <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                    <p className="text-sm font-semibold mb-1">Sisa Pembayaran:</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(getRemainingBalance())}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Pastikan sisa pembayaran telah diterima sebelum menyerahkan kostum.</p>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => dispatch({ type: 'CLOSE_RENT_MODAL' })} aria-label="Batal">Batal</Button>
              <Button variant="primary" onPress={handleMarkRented} isPending={state.actionLoading} aria-label="Konfirmasi penyewaan">Disewakan</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Cancel Order Confirmation Modal */}
      <Modal.Backdrop isOpen={state.isCancelOpen} onOpenChange={() => dispatch({ type: 'CLOSE_CANCEL_MODAL' })}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Batalkan Pesanan</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3">
                <p>Yakin ingin membatalkan pesanan ini?</p>
                {state.selectedRentData && (
                  <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                    <p className="text-sm font-semibold text-danger mb-1">⚠️ Uang muka tidak akan dikembalikan</p>
                    <p className="text-sm">DP yang telah dibayar sebesar <strong>{formatCurrency(state.selectedRentData.downpayment || 0)}</strong> tidak dapat dikembalikan.</p>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => dispatch({ type: 'CLOSE_CANCEL_MODAL' })} aria-label="Kembali">Kembali</Button>
              <Button variant="danger" onPress={handleCancel} isPending={state.actionLoading} aria-label="Batalkan pesanan">Batalkan Pesanan</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
};

export default RentHistoryPage;
