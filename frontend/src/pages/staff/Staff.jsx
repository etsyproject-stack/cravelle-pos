import { useState } from 'react';
import { staffApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';

const ROLE_COLORS = { admin: 'purple', manager: 'blue', cashier: 'emerald', kitchen: 'amber' };
const ROLE_DESCRIPTIONS = {
  admin: 'Full access including staff role management',
  manager: 'Everything except managing user roles',
  cashier: 'Dashboard, POS, orders, customers, coupons',
  kitchen: 'Kitchen Display System only',
};

function StaffModal({ member, canSetRole, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    member
      ? { name: member.name, email: member.email, role: member.role, password: '' }
      : { name: '', email: '', role: 'cashier', password: '' }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form };
      if (member?.id && !payload.password) delete payload.password;
      if (member?.id) await staffApi.update(member.id, payload);
      else await staffApi.create(payload);
      toast('Staff member saved');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast(err.response?.data?.message || 'Failed to save staff member', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={member?.id ? `Edit — ${member.name}` : 'New Staff Member'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name?.[0]} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email?.[0]} />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          disabled={!canSetRole}
          error={errors.role?.[0]}
        >
          {Object.keys(ROLE_DESCRIPTIONS).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </Select>
        <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[form.role]}</p>
        <Input
          label={member?.id ? 'New password (leave blank to keep current)' : 'Password'}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password?.[0]}
        />
      </div>
    </Modal>
  );
}

export default function Staff() {
  const { data, loading, reload } = useApi(() => staffApi.list());
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [editMember, setEditMember] = useState(null);

  const staff = data?.data || [];
  const canSetRole = hasRole('admin');

  const destroy = async (member) => {
    if (!window.confirm(`Remove ${member.name} from staff?`)) return;
    try {
      await staffApi.remove(member.id);
      toast('Staff member removed');
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditMember({})}>+ New Staff Member</Button>
      </div>
      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Name', render: (m) => (
                  <span className="font-semibold">{m.name}{m.id === user.id && ' (you)'}</span>
                ) },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role', render: (m) => (
                  <Badge color={ROLE_COLORS[m.role]}>{m.role}</Badge>
                ) },
              { key: 'created_at', label: 'Joined', render: (m) => new Date(m.created_at).toLocaleDateString() },
            ]}
            rows={staff}
            renderActions={(m) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditMember(m)}>Edit</Button>
                {m.id !== user.id && (
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(m)}>Remove</Button>
                )}
              </>
            )}
          />
        )}
      </Card>
      {editMember && (
        <StaffModal
          member={editMember.id ? editMember : null}
          canSetRole={canSetRole}
          onClose={() => setEditMember(null)}
          onSaved={() => { setEditMember(null); reload(); }}
        />
      )}
    </div>
  );
}
