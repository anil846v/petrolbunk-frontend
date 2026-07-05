import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { createUserSchema, updateUserSchema } from '../../validations/userSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

// Admin-only form — the parent page must guard access by role, not this component
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
];

export default function UserForm({ defaultValues, onSubmit, loading }) {
  const isEdit = !!defaultValues?.id;
  const schema = isEdit ? updateUserSchema : createUserSchema;

  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(schema, { defaultValues });
  useFormErrorLogger(errors, 'UserForm');

  useEffect(() => { reset(defaultValues ?? {}); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Username" error={errors.username?.message} required>
        <Input {...register('username')} placeholder="e.g. john_doe" error={errors.username} />
      </FormField>

      <FormField label="Email" error={errors.email?.message} required>
        <Input {...register('email')} type="email" placeholder="e.g. john@example.com" error={errors.email} />
      </FormField>

      {!isEdit && (
        <FormField label="Password" error={errors.password?.message} required>
          <Input {...register('password')} type="password" placeholder="Min 6 characters" error={errors.password} />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Role" error={errors.role?.message} required>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select {...field} options={ROLE_OPTIONS} placeholder="Select role" error={errors.role} />
            )}
          />
        </FormField>

        <FormField label="Phone" error={errors.phone_no?.message}>
          <Input {...register('phone_no')} type="tel" placeholder="10-digit number" error={errors.phone_no} />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
