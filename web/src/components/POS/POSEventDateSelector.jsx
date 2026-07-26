import { Card, Button, Separator } from '@heroui/react';
import HeroDatePicker from '@/components/HeroDatePicker';

export default function POSEventDateSelector({
  formData,
  setFormData,
  errors,
  setErrors,
  isDatePanelCollapsed,
  setIsDatePanelCollapsed,
  settings
}) {
  return formData.event_date && isDatePanelCollapsed ? (
    <div className="bg-content1 border border-default-200 rounded-xl p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success text-xs font-bold">✓</span>
        <div className="text-sm font-semibold">
          Tanggal Acara: <span className="text-primary">{formData.event_date}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-default-500 bg-default-100 px-2 py-0.5 rounded-full">
          <span>Ambil: H-{settings.pickup_days_before || 2}</span>
          <span>•</span>
          <span>Kembali: H+{settings.return_days_after || 1}</span>
        </div>
      </div>
      <Button variant="light" color="primary" size="sm" className="font-bold text-xs" onPress={() => setIsDatePanelCollapsed(false)}>
        Ubah Tanggal
      </Button>
    </div>
  ) : (
    <Card className="border border-default-200">
      <Card.Content className="p-4 flex flex-col gap-3">
        <h3 className="font-bold text-base text-default-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
          Tentukan Tanggal Acara
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <HeroDatePicker
            isRequired
            label="Tanggal Acara"
            value={formData.event_date}
            onChange={(e) => {
              setFormData(p => ({ ...p, event_date: e.target.value }));
              setErrors(p => ({ ...p, event_date: null }));
            }}
            isInvalid={!!errors.event_date}
            errorMessage={errors.event_date}
            className="flex-1 w-full min-w-[240px]"
          />
          {formData.event_date && (
            <div className="flex gap-4 p-3 bg-default-100 rounded-lg text-xs font-medium text-default-600 shrink-0 w-full md:w-auto justify-between md:justify-start">
              <div>Persiapan Ambil: <span className="text-primary font-semibold">H-{settings.pickup_days_before || 2}</span></div>
              <Separator orientation="vertical" className="hidden md:block h-4" />
              <div>Batas Pengembalian: <span className="text-primary font-semibold">H+{settings.return_days_after || 1}</span></div>
            </div>
          )}
        </div>
        {formData.event_date && (
          <div className="flex justify-end mt-1">
            <Button size="sm" color="success" className="font-bold text-xs rounded-full px-4 text-white" onPress={() => setIsDatePanelCollapsed(true)}>
              Simpan & Lanjutkan
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
