import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  Check,
  X,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { LocalUser, UserRole } from '../../types';
import { localDB } from '../../services/storage';

interface UsersViewProps {
  users: LocalUser[];
  currentUser: LocalUser;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: 'bendahara' as UserRole,
    password: '',
  });
  const [successMsg, setSuccessMsg] = useState('');

  const permissions = [
    { name: 'Melihat Dashboard & Laporan', bendahara: true, kepsek: true, operator: true, admin: true, pengawas: true },
    { name: 'Menambah & Mengubah Transaksi BKU', bendahara: true, kepsek: false, operator: true, admin: true, pengawas: false },
    { name: 'Membatalkan Transaksi BKU', bendahara: true, kepsek: true, operator: false, admin: true, pengawas: false },
    { name: 'Input Belanja & Foto Barang', bendahara: true, kepsek: false, operator: true, admin: true, pengawas: false },
    { name: 'Membuat Dokumen SPJ PDF (4-in-1)', bendahara: true, kepsek: true, operator: true, admin: true, pengawas: false },
    { name: 'Mengesahkan Dokumen SPJ', bendahara: false, kepsek: true, operator: false, admin: true, pengawas: false },
    { name: 'Ekspor Excel & Cetak Dokumen', bendahara: true, kepsek: true, operator: true, admin: true, pengawas: true },
    { name: 'Backup & Restore Database SQLite', bendahara: true, kepsek: true, operator: false, admin: true, pengawas: false },
    { name: 'Mengelola Akun Pengguna Lokal', bendahara: false, kepsek: true, operator: false, admin: true, pengawas: false },
  ];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim()) return;

    const newUser: LocalUser = {
      id: 'usr-' + Date.now(),
      username: formData.username.trim().toLowerCase(),
      fullName: formData.fullName.trim(),
      role: formData.role,
      createdAt: new Date().toISOString().split('T')[0],
    };

    localDB.saveUser(newUser);
    setSuccessMsg(`Pengguna ${newUser.fullName} berhasil ditambahkan ke sistem otentikasi lokal!`);
    setModalOpen(false);
    onRefresh();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            Manajemen Pengguna Lokal & Matriks Hak Akses (RBAC)
          </h3>
          <p className="text-xs text-slate-500">
            Akses dikontrol secara mandiri di komputer lokal tanpa bergantung pada koneksi internet.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus size={15} />
          <span>+ Tambah Pengguna Lokal</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => {
          const isMe = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 ${
                isMe ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {u.fullName.charAt(0)}
                </div>
                {isMe ? (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Sesi Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {u.role.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs leading-snug">{u.fullName}</h4>
                <p className="text-[11px] text-slate-500 font-mono">@{u.username}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                Terdaftar: {u.createdAt}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Matriks Otoritas & Hak Akses Berdasarkan Peran (Role-Based Access Control)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <th className="p-3 border-r border-slate-200 text-center">Fitur & Kewenangan</th>
                <th className="p-3 border-r border-slate-200 text-center w-28">Bendahara</th>
                <th className="p-3 border-r border-slate-200 text-center w-32">Kepala Sekolah</th>
                <th className="p-3 border-r border-slate-200 text-center w-28">Operator</th>
                <th className="p-3 text-center w-28">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="p-3 border-r border-slate-200 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3 border-r border-slate-200 text-center">
                    {p.bendahara ? <Check size={16} className="text-emerald-600 mx-auto" /> : <X size={16} className="text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-3 border-r border-slate-200 text-center">
                    {p.kepsek ? <Check size={16} className="text-emerald-600 mx-auto" /> : <X size={16} className="text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-3 border-r border-slate-200 text-center">
                    {p.operator ? <Check size={16} className="text-emerald-600 mx-auto" /> : <X size={16} className="text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {p.admin ? <Check size={16} className="text-emerald-600 mx-auto" /> : <X size={16} className="text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Tambah Pengguna Lokal Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login</label>
                <input
                  type="text"
                  placeholder="Contoh: bendahara2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: AHMAD FAUZI, S.Pd"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Peran Akses (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="bendahara">Bendahara BOS</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="operator">Operator Sekolah</option>
                  <option value="admin">Administrator</option>
                  <option value="pengawas">Pengawas Sekolah</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kata Sandi Lokal</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1769E0] text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
