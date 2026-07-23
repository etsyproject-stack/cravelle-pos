import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { couponApi } from '../../api';
import { useToast } from '../../context/ToastContext';

/** Order-level discount: manual (percent/fixed) and/or a coupon code. */
export default function DiscountModal({ open, onClose, cart, subtotal, setDiscount, setCoupon }) {
  const { toast } = useToast();
  const [type, setType] = useState(cart.discountType);
  const [value, setValue] = useState(cart.discountValue);
  const [code, setCode] = useState(cart.coupon?.code || '');
  const [checking, setChecking] = useState(false);

  const applyCoupon = async () => {
    if (!code.trim()) {
      setCoupon(null);
      return;
    }
    setChecking(true);
    try {
      const { data } = await couponApi.validate(code.trim(), subtotal);
      setCoupon(data.data);
      toast(`Coupon ${data.data.code} applied`);
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid coupon', 'error');
    } finally {
      setChecking(false);
    }
  };

  const save = () => {
    setDiscount(type, Number(value) || 0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Discount & Coupon"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Apply</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Discount type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="none">No discount</option>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input
            label="Value"
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={type === 'none'}
          />
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Coupon code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE10"
              />
            </div>
            <Button variant="outline" onClick={applyCoupon} disabled={checking}>
              {checking ? 'Checking…' : 'Apply'}
            </Button>
          </div>
          {cart.coupon && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
              <span className="font-semibold text-emerald-700">
                {cart.coupon.code} — saves {Number(cart.coupon.discount).toFixed(2)}
              </span>
              <button
                onClick={() => { setCoupon(null); setCode(''); }}
                className="text-xs font-semibold text-red-600"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
