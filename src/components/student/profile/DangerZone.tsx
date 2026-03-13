'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function DangerZone({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const exportData = () => {
    toast.info('Data export request received. You will receive an email shortly.');
  };

  const deleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    
    try {
      // In a real app, this should be a secure server action that deletes the auth user.
      // For now, sign out and redirect as requested.
      await supabase.auth.signOut();
      toast.success('Account deletion requested. We will process it within 24 hours.', { duration: 5000 });
      router.push('/');
    } catch (err) {
      toast.error('Failed to request deletion. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
      {/* Titlebar */}
      <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex items-center">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="flex-1 text-center font-bold text-[13px] text-[#FF5F57] pr-6">Danger Zone</span>
      </div>

      <div className="p-6 space-y-5">
        
        {/* Export Data */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Download className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="font-bold text-[14px] text-gray-900">Export My Data</p>
              <p className="text-[13px] text-gray-500 mt-1 max-w-sm">
                Download a copy of all your learning data, orders, and certificates.
              </p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 font-semibold text-[13px] rounded-full px-5 py-2.5 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Export Data
          </button>
        </div>

        {/* Delete Account */}
        <div className="bg-red-50/50 rounded-xl border border-red-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-red-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Trash2 className="w-5 h-5 text-[#FF5F57]" />
            </div>
            <div>
              <p className="font-bold text-[14px] text-[#FF5F57]">Delete Account</p>
              <p className="text-[13px] text-gray-600 mt-1 max-w-sm">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-shrink-0 bg-white border border-red-200 text-[#FF5F57] font-bold text-[13px] rounded-full px-5 py-2.5 hover:bg-red-50 transition-colors shadow-sm"
          >
            Delete Account
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal (Built-in to avoid shadcn deps if missing) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-5 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-[#FF5F57]" />
              </div>
              
              <h3 className="font-bold text-[20px] text-gray-900 mb-2">Delete your account?</h3>
              <div className="text-[14px] text-gray-600 space-y-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 hidden sm:block">
                <p>This will permanently delete:</p>
                <ul className="list-disc pl-5 space-y-1 font-medium text-gray-700">
                  <li>Your profile information</li>
                  <li>All enrollments and course progress</li>
                  <li>All earned certificates</li>
                  <li>All order history and addresses</li>
                </ul>
                <p className="font-bold text-[#FF5F57] mt-3">This action cannot be undone.</p>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-gray-600 mb-2">
                  To confirm, type <span className="text-gray-900 font-bold bg-gray-100 px-1.5 py-0.5 rounded">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-[14px] font-bold text-gray-900 transition-colors focus:outline-none ${
                    deleteInput === 'DELETE' 
                      ? 'border-[#FF5F57] focus:ring-1 focus:ring-[#FF5F57]' 
                      : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setDeleteInput(''); }}
                  disabled={deleting}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold text-[14px] rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF5F57] text-white font-bold text-[14px] rounded-xl px-4 py-3 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
