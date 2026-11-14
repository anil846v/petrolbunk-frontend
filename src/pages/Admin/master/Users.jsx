import { useState } from 'react';
import { Pencil, KeyRound, ToggleLeft, ToggleRight, Users as UsersIcon } from 'lucide-react';
import { useListPage } from '../../../hooks/useListPage';
import { useToast } from '../../../components/common/Toaster';
import { useAuth } from '../../../context/AuthContext';
import { userApi, getFileUrl } from '../../../utils/api';
import PageHeader   from '../../../components/common/PageHeader';
import Table        from '../../../components/common/Table';
import Badge        from '../../../components/common/Badge';
import Button       from '../../../components/common/Button';
import Input        from '../../../components/common/Input';
import Select       from '../../../components/common/Select';
import Modal        from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import UserForm     from '../../../components/master/UserForm';
import FormField    from '../../../components/common/FormField';
import { useAppForm } from '../../../hooks/useAppForm';
import { resetPasswordSchema } from '../../../validations/userSchema';

const ROLE_OPTS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
];

function ResetPasswordForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useAppForm(resetPasswordSchema);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="New Password" error={errors.new_password?.message} required>
        <Input {...register('new_password')} type="password" placeholder="Min 6 characters" error={errors.new_password} />
      </FormField>
      <FormField label="Confirm New Password" error={errors.confirm_password?.message} required>
        <Input {...register('confirm_password')} type="password" placeholder="Repeat password" error={errors.confirm_password} />
      </FormField>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Reset Password</Button>
      </div>
    </form>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const list = useListPage(userApi.list);
  const { toast } = useToast();

  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (list.selected?.id) {
        if (data instanceof FormData) {
          if (Number(list.selected.id) === Number(currentUser?.id)) {
            data.set('role', currentUser.role || list.selected.role);
          }
          await userApi.update(list.selected.id, data);
        } else {
          const payload = { ...data };
          if (Number(list.selected.id) === Number(currentUser?.id)) {
            payload.role = currentUser.role || list.selected.role;
          }
          await userApi.update(list.selected.id, payload);
        }
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
    const target = list.selected;
    if (!target) return;

    if (Number(target.id) === Number(currentUser?.id) && target.is_active) {
      toast('You cannot deactivate your own account', 'error');
      list.closeModal();
      return;
    }

    const prevStatus = target.is_active;
    const nextStatus = !prevStatus;

    // Optimistic UI update
    list.setRows((rows) =>
      rows.map((r) => (r.id === target.id ? { ...r, is_active: nextStatus } : r))
    );
    list.closeModal();

    setToggling(true);
    try {
      await userApi.toggleStatus(target.id);
      toast(`User ${nextStatus ? 'activated' : 'deactivated'}`, 'success');
      list.refresh(true);
    } catch (err) {
      // Rollback on failure
      list.setRows((rows) =>
        rows.map((r) => (r.id === target.id ? { ...r, is_active: prevStatus } : r))
      );
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleResetPassword = async ({ new_password }) => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await userApi.resetPassword(resetTarget.id, { new_password });
      toast('Password reset successfully', 'success');
      setResetTarget(null);
    } catch (err) {
      toast(err.message || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    { 
      key: 'username', 
      label: 'User', 
      sortable: true,
      render: (v, row) => {
        const avatarUrl = getFileUrl(row.profile_image);
        const initials = (v || '?').slice(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-50 border border-primary-200 flex items-center justify-center flex-shrink-0 text-primary-700 font-semibold text-xs shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={v} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-800">{v}</span>
                {Number(row.id) === Number(currentUser?.id) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    You
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-400 block">{row.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role', label: 'Role', align: 'center', sortable: true,
      render: (v) => <Badge variant={v === 'ADMIN' ? 'primary' : 'neutral'}>{v}</Badge>,
    },
    { key: 'phone_no', label: 'Phone', render: (v) => v || '—' },
    {
      key: 'is_active', label: 'Status', align: 'center', sortable: true,
      render: (v) => <Badge variant={v ? 'success' : 'neutral'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (_, row) => {
        const isSelf = Number(row.id) === Number(currentUser?.id);
        const cannotDeactivate = isSelf && row.is_active;

        return (
          <div className="flex items-center justify-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => list.openEdit(row)} aria-label="Edit">
              <Pencil size={15} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setResetTarget(row)} aria-label="Reset password">
              <KeyRound size={15} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={cannotDeactivate}
              onClick={() => {
                if (cannotDeactivate) {
                  toast('You cannot deactivate your own account', 'error');
                  return;
                }
                list.openDelete(row);
              }}
              title={cannotDeactivate ? 'You cannot deactivate your own account' : (row.is_active ? 'Deactivate User' : 'Activate User')}
              aria-label="Toggle Status"
              className={cannotDeactivate ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : ''}
            >
              {row.is_active
                ? <ToggleRight size={18} className={cannotDeactivate ? 'text-neutral-400' : 'text-success'} />
                : <ToggleLeft  size={18} className="text-neutral-muted" />}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader 
        title="Users" 
        subtitle="Manage admin and staff accounts" 
        icon={UsersIcon}
        onAdd={list.openAdd} 
      />

      <div className="bg-white rounded-lg border border-neutral-border shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
          <Input placeholder="Search by name or email..." value={list.search}
            onChange={(e) => list.setSearch(e.target.value)} className="w-full" />
        </div>
        <div className="w-full sm:w-auto">
          <Select options={ROLE_OPTS} placeholder="All roles" value={list.params.role || ''}
            onChange={(e) => list.setFilter('role', e.target.value || undefined)} className="w-full sm:w-36" />
        </div>
      </div>

      <Table
        columns={columns}
        rows={list.rows} 
        meta={list.meta} 
        loading={list.loading}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        sortBy={list.params.sortBy}
        sortOrder={list.params.order}
        onSort={list.setSort}
        emptyText="No users found."
      />

      {/* Add / Edit */}
      <Modal open={list.modal === 'add' || list.modal === 'edit'} onClose={list.closeModal}
        title={list.modal === 'edit' ? 'Edit User' : 'New User'}>
        <UserForm 
          defaultValues={list.modal === 'edit' ? list.selected : null}
          isSelf={Number(list.selected?.id) === Number(currentUser?.id)}
          onSubmit={handleSave} 
          loading={saving} 
        />
      </Modal>

      {/* Reset Password */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)}
        title={`Reset Password — ${resetTarget?.username}`} size="sm">
        <ResetPasswordForm
          onSubmit={handleResetPassword}
          loading={resetting}
        />
      </Modal>

      {/* Toggle status */}
      <ConfirmModal open={list.modal === 'delete'} onClose={list.closeModal}
        onConfirm={handleToggle} loading={toggling}
        title={list.selected?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          Number(list.selected?.id) === Number(currentUser?.id) && list.selected?.is_active
            ? 'You cannot deactivate your own logged-in account.'
            : `Are you sure you want to ${list.selected?.is_active ? 'deactivate' : 'activate'} "${list.selected?.username}"?`
        }
      />
    </>
  );
}
