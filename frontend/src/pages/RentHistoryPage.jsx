import { useReducer, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRents, cancelRent } from '../api/rentApi';
import {
  Input, Button, Select, ListBox,
  Spinner, Modal, Card, Tooltip
} from '@heroui/react';
import { Download, UploadCloud } from 'lucide-react';
import CustomPagination from '../components/CustomPagination';
import RentHistoryTable from '../components/RentHistoryTable';
import MarkReturnedModal from '../components/MarkReturnedModal';
import MarkRentedModal from '../components/MarkRentedModal';
import ExcelImportModal from '../components/ExcelImportModal';

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
  isImportOpen: false,
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
      return { ...state, isReturnOpen: true, selectedRentId: action.payload.id, selectedRentData: action.payload.data };
    case 'CLOSE_RETURN_MODAL':
      return { ...state, isReturnOpen: false, selectedRentId: null, selectedRentData: null };
    case 'OPEN_RENT_MODAL': {
      const rentData = state.rents.find(r => r.id === action.payload);
      return { ...state, isRentOpen: true, selectedRentId: action.payload, selectedRentData: rentData || null };
    }
    case 'CLOSE_RENT_MODAL':
      return { ...state, isRentOpen: false, selectedRentId: null, selectedRentData: null };
    case 'OPEN_CANCEL_MODAL': {
      const rentData = state.rents.find(r => r.id === action.payload.id);
      return { ...state, isCancelOpen: true, selectedRentId: action.payload.id, selectedRentData: action.payload.data || rentData || null };
    }
    case 'CLOSE_CANCEL_MODAL':
      return { ...state, isCancelOpen: false, selectedRentId: null, selectedRentData: null };
    case 'OPEN_IMPORT_MODAL':
      return { ...state, isImportOpen: true };
    case 'CLOSE_IMPORT_MODAL':
      return { ...state, isImportOpen: false };
    case 'SET_ACTION_LOADING':
      return { ...state, actionLoading: action.payload };
    default:
      return state;
  }
}

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatCurrency = (value) => {
  return idrFormatter.format(value);
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
      const response = await getRents({
        search: state.debouncedSearch.trim(),
        status: state.statusFilter,
        page: state.page,
        limit: state.limit,
      });
      const data = response.data.data || [];
      dispatch({
        type: 'SET_RENTS',
        payload: {
          rents: data,
          totalPages: response.data.total_pages || 1,
          total: response.data.total || 0,
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


  const getRemainingBalance = () => {
    const rent = state.selectedRentData;
    if (!rent) return 0;
    const totalFee = rent.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;
    return Math.max(0, totalFee - (rent.total_paid || 0));
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

  const openRentModal = (id) => {
    dispatch({ type: 'OPEN_RENT_MODAL', payload: id });
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rents-excel/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rents_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="page-title">Riwayat Peminjaman</h1>
          <div className="flex items-center gap-2">
            <Tooltip content="Eksport Excel">
              <Button isIconOnly onPress={handleExport} variant="outline" aria-label="Eksport">
                <Download size={18} />
              </Button>
            </Tooltip>
            <Tooltip content="Import Excel">
              <Button isIconOnly onPress={() => dispatch({ type: 'OPEN_IMPORT_MODAL' })} variant="outline" aria-label="Import">
                <UploadCloud size={18} />
              </Button>
            </Tooltip>
            <Button
              onPress={() => navigate('/pos')}
              variant="primary"
              aria-label="Peminjaman Baru via POS"
            >
              Peminjaman Baru
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <Input
            placeholder="Cari ID transaksi, nama klien, atau telepon..."
            value={state.search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            aria-label="Cari peminjaman"
            className="w-full sm:w-[300px]"
          />
          <Select
            placeholder="Semua Status"
            value={state.statusFilter || null}
            onChange={(key) => dispatch({ type: 'SET_STATUS_FILTER', payload: key ? String(key) : '' })}
            className="w-full sm:w-[160px]"
            aria-label="Filter status peminjaman"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="" textValue="Semua Status">Semua Status<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="booked" textValue="Booked">Booked<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="rented" textValue="Dipinjam">Dipinjam<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="returned" textValue="Selesai">Selesai<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="cancelled" textValue="Dibatalkan">Dibatalkan<ListBox.ItemIndicator /></ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Card.Header>

      <Card.Content className="p-0">
        {state.loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner aria-label="Memuat data peminjaman" />
          </div>
        ) : (
          <RentHistoryTable 
            rents={state.rents} 
            onOpenReturnModal={(id, data) => dispatch({ type: 'OPEN_RETURN_MODAL', payload: { id, data } })}
            onOpenRentModal={openRentModal}
            onOpenCancelModal={(id, data) => dispatch({ type: 'OPEN_CANCEL_MODAL', payload: { id, data } })}
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

      <MarkReturnedModal
        isOpen={state.isReturnOpen}
        onClose={() => dispatch({ type: 'CLOSE_RETURN_MODAL' })}
        onSuccess={fetchRents}
        rentId={state.selectedRentId}
        rentData={state.selectedRentData}
      />

      <MarkRentedModal
        isOpen={state.isRentOpen}
        onClose={() => dispatch({ type: 'CLOSE_RENT_MODAL' })}
        onSuccess={fetchRents}
        rentId={state.selectedRentId}
        sisaTagihan={getRemainingBalance()}
      />

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
                    <p className="text-sm">DP yang telah dibayar sebesar <strong>{formatCurrency(state.selectedRentData.total_paid || 0)}</strong> tidak dapat dikembalikan.</p>
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

      <ExcelImportModal
        isOpen={state.isImportOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_IMPORT_MODAL' });
          else dispatch({ type: 'OPEN_IMPORT_MODAL' });
        }}
        title="Import Riwayat Peminjaman"
        templateUrl={`/api/rents-excel/template`}
        uploadUrl={`/api/rents-excel/import`}
        onSuccess={fetchRents}
      />
    </Card>
  );
};

export default RentHistoryPage;
