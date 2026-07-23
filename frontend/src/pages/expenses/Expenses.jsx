import { useState } from 'react';
import { expenseApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';

const CATEGORIES = ['ingredients', 'utilities', 'rent', 'salaries', 'maintenance', 'marketing', 'other'];

function ExpenseModal({ expense, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    expense || {
      title: '',
      category: 'ingredients',
      amount: '',
      expense_date: new Date().toISOString().slice(0, 10),
      notes: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (expense?.id) await expenseApi.update(expense.id, form);
      else await expenseApi.create(form);
      toast('Expense saved');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={expense?.id ? 'Edit Expense' : 'New Expense'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title?.[0]} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </Select>
          <Input label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={errors.amount?.[0]} />
        </div>
        <Input label="Date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} error={errors.expense_date?.[0]} />
        <Textarea label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
    </Modal>
  );
}

export default function Expenses() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, loading, reload } = useApi(() => expenseApi.list({ month }), [month]);
  const { formatMoney } = useSettings();
  const { toast } = useToast();
  const [editExpense, setEditExpense] = useState(null);

  const expenses = data?.data || [];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const destroy = async (e) => {
    if (!window.confirm(`Delete expense "${e.title}"?`)) return;
    try {
      await expenseApi.remove(e.id);
      toast('Expense deleted');
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-600">
            Total: <span className="font-bold text-red-600">{formatMoney(total)}</span>
          </span>
        </div>
        <Button onClick={() => setEditExpense({})}>+ New Expense</Button>
      </div>
      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              { key: 'expense_date', label: 'Date', render: (e) => new Date(e.expense_date).toLocaleDateString() },
              { key: 'title', label: 'Title', render: (e) => <span className="font-semibold">{e.title}</span> },
              { key: 'category', label: 'Category', render: (e) => <Badge>{e.category}</Badge> },
              { key: 'amount', label: 'Amount', render: (e) => <span className="font-semibold text-red-600">{formatMoney(e.amount)}</span> },
              { key: 'user', label: 'Recorded by', render: (e) => e.user?.name || '—' },
            ]}
            rows={expenses}
            empty="No expenses recorded for this month."
            renderActions={(e) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditExpense(e)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(e)}>Delete</Button>
              </>
            )}
          />
        )}
      </Card>
      {editExpense && (
        <ExpenseModal
          expense={editExpense.id ? editExpense : null}
          onClose={() => setEditExpense(null)}
          onSaved={() => { setEditExpense(null); reload(); }}
        />
      )}
    </div>
  );
}
