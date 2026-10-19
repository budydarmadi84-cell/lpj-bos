import React, { useState } from 'react';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
  Wallet,
  X,
} from 'lucide-react';
import { BudgetCategory, FiscalYear, SchoolProfile } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { localDB } from '../../services/storage';
import { exportRealisasiToExcel } from '../../services/excelExport';

interface AnggaranViewProps {
  categories: BudgetCategory[];
  fiscalYear: FiscalYear;
  school: SchoolProfile;
  onRefresh: () => void;
}

export const AnggaranView: React.FC<AnggaranViewProps> = ({
  categories,
  fiscalYear,
  school,
  onRefresh,
}) => {
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [anggaranInput, setAnggaranInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const totalAnggaran = categories.reduce((a, b) => a + b.anggaran, 0);
  const totalRealisasi = categories.reduce((a, b) => a + b.realisasi, 0);
  const totalSisa = Math.max(0, totalAnggaran - totalRealisasi);
  const totalPersen = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 100) : 0;

  const handleEditPagu = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setAnggaranInput(cat.anggaran.toString());
  };

  const handleSavePagu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const val = parseInt(anggaranInput, 10);
    if (isNaN(val) || val < 0) return;

    localDB.saveCategory({
      ...editingCategory,
      anggaran: val,
    });

    setEditingCategory(null);
    setSuccessMsg(`Pagu anggaran untuk ${editingCategory.nama} berhasil diperbarui!`);
    onRefresh();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pagu Anggaran</span>
            <p className="text-xl font-black text-slate-900">{formatRupiah(totalAnggaran)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Total Realisasi Belanja</span>
            <p className="text-xl font-black text-rose-700">{formatRupiah(totalRealisasi)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Sisa Pagu Tersedia</span>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(totalSisa)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Persentase Penyerapan</span>
            <p className="text-xl font-black text-indigo-700">{totalPersen}%</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <PieChart size={20} />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Controls & Export */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart size={18} className="text-blue-600" />
            Alokasi Pagu Anggaran per Komponen Penggunaan BOS
          </h3>
          <p className="text-xs text-slate-500">
            Standar komponen pembiayaan operasional sekolah Tahun Anggaran {fiscalYear.tahun}
          </p>
        </div>

        <button
          onClick={() => exportRealisasiToExcel(categories, school, fiscalYear)}
          className="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <FileSpreadsheet size={15} />
          <span>Ekspor Realisasi Excel</span>
        </button>
      </div>

      {/* 3. Table of Categories */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28 text-center">Kode Rekening</th>
                <th className="py-3 px-4 text-center">Nama Komponen Penggunaan BOS</th>
                <th className="py-3 px-4 text-center">Pagu Anggaran (Rp)</th>
                <th className="py-3 px-4 text-center">Realisasi Belanja (Rp)</th>
                <th className="py-3 px-4 text-center">Sisa Anggaran (Rp)</th>
                <th className="py-3 px-4 text-center w-36">Capaian & Progress</th>
                <th className="py-3 px-4 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categories.map((cat, idx) => {
                const sisa = Math.max(0, cat.anggaran - cat.realisasi);
                const percent = cat.anggaran > 0 ? Math.round((cat.realisasi / cat.anggaran) * 100) : 0;
                const isOver = cat.realisasi > cat.anggaran;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{cat.kode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{cat.nama}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(cat.anggaran)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatRupiah(cat.realisasi)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatRupiah(sisa)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                          <span className={isOver ? 'text-rose-600' : 'text-slate-600'}>{percent}%</span>
                          {isOver && <span className="text-rose-600 flex items-center gap-0.5"><AlertTriangle size={10} /> Lebih</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-[#1769E0]'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEditPagu(cat)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200"
                        title="Sesuaikan Pagu Anggaran"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Pagu */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Sesuaikan Pagu Anggaran</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePagu} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5 font-mono">{editingCategory.kode}</span>
                <p className="text-xs font-bold text-slate-800">{editingCategory.nama}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nominal Pagu Anggaran (Rp)
                </label>
                <input
                  type="number"
                  value={anggaranInput}
                  onChange={(e) => setAnggaranInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                  required
                />
                {anggaranInput && !isNaN(parseInt(anggaranInput)) && (
                  <p className="text-[10px] text-blue-600 font-medium mt-1">
                    {formatRupiah(parseInt(anggaranInput))}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Simpan Pagu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
