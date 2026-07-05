import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { categorySchema } from '../../validations/categorySchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const TYPE_OPTIONS = [
  { value: 'INCOME',  label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
];

export default function CategoryForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(categorySchema, { defaultValues });
  useFormErrorLogger(errors, 'CategoryForm');

  useEffect(() => { reset(defaultValues ?? {}); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message} required>
        <Input {...register('name')} placeholder="e.g. Fuel Income" error={errors.name} />
      </FormField>

      <FormField label="Type" error={errors.type?.message} required>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select {...field} options={TYPE_OPTIONS} placeholder="Select type" error={errors.type} />
          )}
        />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
