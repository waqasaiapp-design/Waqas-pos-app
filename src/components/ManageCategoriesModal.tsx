import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { CategoryInfo } from '../types/pos';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  categories: CategoryInfo[];
  onClose: () => void;
  onAddCategory: (category: CategoryInfo) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  categories,
  onClose,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatUrdu, setNewCatUrdu] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    onAddCategory({
      id: newCatName.trim().toUpperCase(),
      name: newCatName.trim(),
      urduName: newCatUrdu.trim() || undefined,
    });

    setNewCatName('');
    setNewCatUrdu('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Manage Product Categories</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to add category */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-200 bg-slate-50 space-y-2.5">
          {error && (
            <div className="p-2 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category Name (e.g. SNACKS)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="pt-2 first:pt-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                {cat.urduName && <p className="text-xs text-slate-500 font-urdu">{cat.urduName}</p>}
              </div>

              {/* Prevent deleting default system category */}
              {cat.id !== 'ALL ITEMS' ? (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Default</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
