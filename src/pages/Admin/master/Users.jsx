import { useState } from 'react';
import { Pencil, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { userApi } from '../../../utils/api';
import { resetPasswordSchema } from '../../../validations/userSchema';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Badge        from '../../../components/common/Badge';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Select       from '../../../components/common/Select';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import FormField    from '../../../components/common/FormField';
import UserForm     from '../../../components/master/UserForm';

const ROLE_OPTS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
];

// Inline reset-password form — simple enough not to need its own file
function ResetPasswordForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    mode: 'onBlur',
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="New Password" error={errors.new_password?.message} required>
        <Input {...register('new_password')} type="password" placeholder="Min 6 characters" error={errors.new_password} />
      </FormField>
      <FormField label="Confirm Password" error={errors.confirm_password?.message} required>
        <Input {...register('confirm_password')} type="password" placeholder="Re-enter password" error={errors.confirm_password} />
      </FormField>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Reset Password</Button>
      </div>
    </form>
  );
}

export default function Users() {
  const list      = useListPage(userApi.list);
  const { toast } = useToast();
  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        await userApi.update(list.selected.id, data);
        toast('User updated', 'success');
      } else {
        await userApi.create(data);
        toast('User created', 'success');
      }
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await userApi.toggleStatus(list.selected.id);
      toast(`User ${list.selected.is_active ? 'deactivated' : 'activated'}`, 'success');
      list.closeModal();
      list.refresh();
    } catch (err) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleResetPassword = async ({ new_password }) => {
    setResetting(true);
    try {
      await userApi.resetPassword(list.selected.id, { new_password });
      toast('Password reset successfully', 'success');
      list.closeModal();
    } catch (err) {
      toast(err.message || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email',    label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (v) => <Badge variant={v === 'ADMIN' ? 'primary' : 'neutral'}>{v}</Badge>,
    },
    { key: 'phone_no', label: 'Phone', render: (v) => v || '—' },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)} aria-label="Edit">
            <Pencil size={15} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { list.setSelected?.(row); list.setModal?.('reset'); }} aria-label="Reset password"
            // openDelete reuses the modal slot; for reset we use a separate slot via direct state
            // NOTE: parent must expose setSelected/setModal — here we use openDelete as a workaround
            // and distinguish by title in the modal below
          >
            <KeyRound size={15} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}>
            {row.is_active
              ? <ToggleRight size={18} className="text-success" />
              : <ToggleLeft  size={18} className="text-neutral-muted" />}
          </Button>
        </div>
      ),
    },
  ];

  // useListPage doesn't expose setModal directly — use a local slot for reset password
  const [resetTarget, setResetTarget] = useState(null);

  return (
    <>
      <PageHeader title="Users" subtitle="Manage admin and staff accounts" onAdd={list.openAdd} />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex gap-3">
        <Input placeholder="Search by name or email..." value={list.search}
          onChange={(e) => list.setSearch(e.target.value)} className="max-w-xs" />
        <Select options={ROLE_OPTS} placeholder="All roles" value={list.params.role || ''}
          onChange={(e) => list.setFilter('role', e.target.value || undefined)} className="w-36" />
      </div>

      <Table
        columns={columns.map((col) =>
          col.key === 'actions'
            ? {
                ...col,
                render: (_, row) => (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)}>
                      <Pencil size={15} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setResetTarget(row)}>
                      <KeyRound size={15} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => list.openDelete(row)}>
                      {row.is_active
                        ? <ToggleRight size={18} className="text-success" />
                        : <ToggleLeft  size={18} className="text-neutral-muted" />}
                    </Button>
                  </div>
                ),
              }
            : col
        )}
        rows={list.rows} meta={list.meta} loading={list.loading}
        onPageChange={list.setPage} emptyText="No users found."
      />

      {/* Add / Edit */}
      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit User' : 'New User'}>
        <UserForm defaultValues={list.modal === 'edit' ? list.selected : null}
          onSubmit={handleSave} loading={saving} />
      </Modal>

      {/* Reset Password */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)}
        title={`Reset Password — ${resetTarget?.username}`} size="sm">
        <ResetPasswordForm
          onSubmit={async (data) => {
            setResetting(true);
            try {
              await userApi.resetPassword(resetTarget.id, { new_password: data.new_password });
              toast('Password reset successfully', 'success');
              setResetTarget(null);
            } catch (err) {
              toast(err.message || 'Failed to reset', 'error');
            } finally {
              setResetting(false);
            }
          }}
          loading={resetting}
        />
      </Modal>

      {/* Toggle status */}
      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleToggle} loading={toggling}
        title={list.selected?.is_active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${list.selected?.is_active ? 'deactivate' : 'activate'} "${list.selected?.username}"?`}
      />
    </>
  );
}
