'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';

interface Address {
  id: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
}

interface AddressStepProps {
  addresses: Address[];
  userId: string;
  profile?: { full_name?: string; phone?: string } | null;
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function TrafficLights({ size = 8 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FF5F57]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FEBC2E]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#28C840]" />
    </div>
  );
}

const EMPTY_FORM = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', is_default: false,
};

export default function AddressStep({
  addresses: initialAddresses, userId, profile,
  selectedAddressId, onSelectAddress, onBack, onNext,
}: AddressStepProps) {
  const supabase = createClient();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(initialAddresses.length === 0);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleField = (k: string, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const saveAddress = async () => {
    if (!form.full_name || !form.address_line1 || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          full_name: form.full_name,
          phone: form.phone || null,
          address_line1: form.address_line1,
          address_line2: form.address_line2 || null,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: 'India',
          is_default: form.is_default,
        })
        .select()
        .single();

      if (error) throw error;

      const newAddr = data as Address;
      const updated = form.is_default
        ? [newAddr, ...addresses.map(a => ({ ...a, is_default: false }))]
        : [...addresses, newAddr];
      setAddresses(updated);
      onSelectAddress(newAddr.id);
      setShowForm(false);
      setForm({ ...EMPTY_FORM, full_name: profile?.full_name || '', phone: profile?.phone || '' });
      toast.success('Address saved!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (selectedAddressId === id) {
      onSelectAddress(updated[0]?.id ?? '');
    }
    await supabase.from('addresses').delete().eq('id', id);
    toast.success('Address removed');
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-3">
      {/* Saved addresses */}
      {addresses.map(addr => {
        const isSelected = selectedAddressId === addr.id;
        return (
          <div
            key={addr.id}
            onClick={() => onSelectAddress(addr.id)}
            className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border shadow-sm ${
              isSelected
                ? 'border-gray-900 shadow-md'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {/* Traffic lights */}
            <TrafficLights size={6} />

            {/* Top row */}
            <div className="flex justify-between items-start mt-2">
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{addr.full_name}</p>
                {addr.phone && <p className="text-[12px] text-gray-500 mt-0.5">{addr.phone}</p>}
              </div>
              <div className="flex items-center gap-3">
                {addr.is_default && (
                  <span className="text-[10px] font-semibold text-[#28C840] bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    Default
                  </span>
                )}
                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
              </div>
            </div>

            {/* Address text */}
            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
              {addr.address_line1}
              {addr.address_line2 && `, ${addr.address_line2}`}
              {`, ${addr.city}, ${addr.state} — ${addr.pincode}`}
            </p>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={e => { e.stopPropagation(); deleteAddress(addr.id); }}
                className="text-[11px] text-gray-400 hover:text-[#FF5F57] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}

      {/* Add new address button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 border border-dashed border-gray-300 rounded-2xl p-4 w-full text-[13px] text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add new address
        </button>
      )}

      {/* Add address form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <TrafficLights size={8} />
            <span className="ml-1 text-[13px] font-semibold text-gray-900">New Address</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input
                  className={inputCls}
                  value={form.full_name}
                  onChange={e => handleField('full_name', e.target.value)}
                  placeholder="Recipient's full name"
                />
              </div>
              {/* Phone */}
              <div className="col-span-2">
                <label className={labelCls}>Phone Number</label>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={e => handleField('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  type="tel"
                />
              </div>
              {/* Address Line 1 */}
              <div className="col-span-2">
                <label className={labelCls}>Address Line 1 *</label>
                <input
                  className={inputCls}
                  value={form.address_line1}
                  onChange={e => handleField('address_line1', e.target.value)}
                  placeholder="House/Flat no., Street, Area"
                />
              </div>
              {/* Address Line 2 */}
              <div className="col-span-2">
                <label className={labelCls}>Address Line 2 (optional)</label>
                <input
                  className={inputCls}
                  value={form.address_line2}
                  onChange={e => handleField('address_line2', e.target.value)}
                  placeholder="Landmark, Near..."
                />
              </div>
              {/* City */}
              <div>
                <label className={labelCls}>City *</label>
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={e => handleField('city', e.target.value)}
                  placeholder="Chennai"
                />
              </div>
              {/* State */}
              <div>
                <label className={labelCls}>State *</label>
                <input
                  className={inputCls}
                  value={form.state}
                  onChange={e => handleField('state', e.target.value)}
                  placeholder="Tamil Nadu"
                />
              </div>
              {/* Postal Code */}
              <div>
                <label className={labelCls}>Postal Code *</label>
                <input
                  className={inputCls}
                  value={form.pincode}
                  onChange={e => handleField('pincode', e.target.value)}
                  placeholder="600001"
                  maxLength={6}
                />
              </div>
              {/* Default checkbox */}
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={e => handleField('is_default', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                />
                <label htmlFor="is_default" className="text-[13px] text-gray-700 cursor-pointer">
                  Set as default address
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={saveAddress}
                disabled={saving}
                className="flex-1 bg-gray-900 text-white font-semibold text-[14px] rounded-xl py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium text-[14px] rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No addresses empty state */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-6">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[14px] text-gray-500">Add a delivery address to continue</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          ← Back to Cart
        </button>
        <button
          onClick={onNext}
          disabled={!selectedAddressId}
          className="bg-gray-900 text-white font-semibold text-[14px] rounded-xl px-6 py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}
