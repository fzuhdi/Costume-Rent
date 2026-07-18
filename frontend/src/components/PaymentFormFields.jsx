import { Select, ListBox, TextField, Label, Input } from '@heroui/react';
import FileUploadZone from './FileUploadZone';

const PAYMENT_METHODS = [
  'CASH',
  'TRANSFER BCA',
  'TRANSFER BNI',
  'TRANSFER BRI',
  'TRANSFER MANDIRI',
  'QRIS',
  'EDC',
];

const PaymentFormFields = ({
  amount,
  setAmount,
  method,
  setMethod,
  proof,
  setProof,
  proofFile,
  setProofFile,
  uploadingProof,
  setUploadingProof,
  hideAmount = false,
  errors = {},
  handleUploadGeneric
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {!hideAmount && (
        <TextField>
          <Label className="text-xs font-semibold mb-1 text-default-600 block">Nominal *</Label>
          <Input
            type="number"
            className="w-full bg-content1 border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <p className="text-danger text-xs mt-1 font-medium">{errors.amount}</p>}
        </TextField>
      )}

      <Select
        value={method}
        onChange={setMethod}
      >
        <Label className="text-xs font-semibold mb-1 text-default-600 block">Metode Pembayaran *</Label>
        <Select.Trigger className="w-full flex items-center justify-between bg-content1 border border-default-200 rounded-lg px-3 py-2 text-sm text-left">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox className="bg-content1 border border-default-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-1">
            {PAYMENT_METHODS.map((m) => (
              <ListBox.Item key={m} id={m} textValue={m} className="px-3 py-2 hover:bg-default-100 cursor-pointer rounded-md text-sm outline-none data-[focused]:bg-default-100">
                {m}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {errors.method && <p className="text-danger text-xs mt-1 font-medium -mt-2">{errors.method}</p>}

      {method && method !== 'CASH' && (
        <FileUploadZone
          uploading={uploadingProof}
          fileLabel={proofFile || proof}
          onChange={(e) => handleUploadGeneric(e, setProof, setProofFile, setUploadingProof)}
          error={errors.payment_proof || errors.proof}
          label="Bukti Pembayaran *"
        />
      )}
    </div>
  );
};

export default PaymentFormFields;
