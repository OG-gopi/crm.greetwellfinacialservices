import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Check, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { LoanProduct, InsuranceProduct, InvestmentProduct } from '../../types';
import { Modal } from '../../components/common/Modal';

export const ProductCMS: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'LOAN' | 'INSURANCE' | 'INVESTMENT'>('LOAN');

  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [insuranceProducts, setInsuranceProducts] = useState<InsuranceProduct[]>([]);
  const [investmentProducts, setInvestmentProducts] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dynamic Product Form
  const [form, setForm] = useState<any>({
    name: '',
    code: '',
    category: 'Personal',
    type: 'Life',
    riskLevel: 'Moderate',
    interestRate: '7.5',
    minAmount: '5000',
    maxAmount: '50000',
    coverageAmount: '500000',
    premiumAmount: '50',
    expectedReturnRate: '8.5',
    minInvestment: '1000',
    description: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [lRes, iRes, invRes] = await Promise.all([
        api.get('/products/loan'),
        api.get('/products/insurance'),
        api.get('/products/investment'),
      ]);
      setLoanProducts(lRes.data.data || []);
      setInsuranceProducts(iRes.data.data || []);
      setInvestmentProducts(invRes.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      code: `${activeCategory.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      category: 'Personal',
      type: 'Life',
      riskLevel: 'Moderate',
      interestRate: '7.5',
      minAmount: '5000',
      maxAmount: '50000',
      coverageAmount: '500000',
      premiumAmount: '50',
      expectedReturnRate: '8.5',
      minInvestment: '1000',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeCategory === 'LOAN') {
        if (editingId) await api.put(`/products/loan/${editingId}`, form);
        else await api.post('/products/loan', form);
      } else if (activeCategory === 'INSURANCE') {
        if (editingId) await api.put(`/products/insurance/${editingId}`, form);
        else await api.post('/products/insurance', form);
      } else if (activeCategory === 'INVESTMENT') {
        if (editingId) await api.put(`/products/investment/${editingId}`, form);
        else await api.post('/products/investment', form);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (product: any) => {
    try {
      const endpoint = activeCategory === 'LOAN' ? '/products/loan' : activeCategory === 'INSURANCE' ? '/products/insurance' : '/products/investment';
      await api.put(`${endpoint}/${product.id}`, { isActive: !product.isActive });
      fetchProducts();
    } catch (err) {
      alert('Status update failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CMS & Financial Master Data</h2>
          <p className="text-xs text-slate-500">Configure Loan, Insurance, and Investment products dynamically</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" /> Add New {activeCategory} Product
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold w-fit">
        {(['LOAN', 'INSURANCE', 'INVESTMENT'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              activeCategory === cat ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat} PRODUCTS
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Product Name & Code</th>
                <th className="py-3 px-4">Category / Type</th>
                <th className="py-3 px-4">Key Financial Metric</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading products...</td>
                </tr>
              ) : activeCategory === 'LOAN' ? (
                loanProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {p.code}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {p.interestRate}% APR (${p.minAmount.toLocaleString()} - ${p.maxAmount.toLocaleString()})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className="px-2.5 py-1 text-xs border rounded-md font-semibold hover:bg-slate-100"
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : activeCategory === 'INSURANCE' ? (
                insuranceProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {p.code}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.type}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">
                      Coverage: ${p.coverageAmount.toLocaleString()} | Premium: ${p.premiumAmount}/mo
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className="px-2.5 py-1 text-xs border rounded-md font-semibold hover:bg-slate-100"
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                investmentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {p.code}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">Risk: {p.riskLevel}</td>
                    <td className="py-3 px-4 font-bold text-purple-600">
                      Est. Return: {p.expectedReturnRate}% | Min: ${p.minInvestment.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className="px-2.5 py-1 text-xs border rounded-md font-semibold hover:bg-slate-100"
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add ${activeCategory} Product`}>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g. Prime Personal Loan"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Code</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full p-2 border rounded-lg font-mono"
            />
          </div>

          {activeCategory === 'LOAN' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Personal, Mortgage, Auto"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interest APR (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Amount ($)</label>
                  <input
                    type="number"
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Amount ($)</label>
                  <input
                    type="number"
                    value={form.maxAmount}
                    onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </>
          )}

          {activeCategory === 'INSURANCE' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coverage Amount ($)</label>
                <input
                  type="number"
                  value={form.coverageAmount}
                  onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Premium ($)</label>
                <input
                  type="number"
                  value={form.premiumAmount}
                  onChange={(e) => setForm({ ...form, premiumAmount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {activeCategory === 'INVESTMENT' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.expectedReturnRate}
                  onChange={(e) => setForm({ ...form, expectedReturnRate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Investment ($)</label>
                <input
                  type="number"
                  value={form.minInvestment}
                  onChange={(e) => setForm({ ...form, minInvestment: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-extrabold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
