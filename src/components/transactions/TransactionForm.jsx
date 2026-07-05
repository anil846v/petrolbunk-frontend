import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { transactionSchema } from '../../validations/transactionSchema';
import FormField from '../common/FormField';
import Input     from '../common/Input';
import Select    from '../common/Select';
import Button    from '../common/Button';

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'UPI',  label: 'UPI' },
];

const REF_TYPE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'FUEL',   label: 'Fuel' },
  { value: 'LOAN',   label: 'Loan' },
];

export default function TransactionForm({ defaultValues, onSubmit, loading, categoryOptions = [], vendorOptions = [] }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(transactionSchema, {
    defaultValues: { reference_type: 'MANUAL', ...defaultValues },
  });
  useFormErrorLogger(errors, 'TransactionForm');

  useEffect(() => {
    reset({ reference_type: 'MANUAL', ...defaultValues });
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date" error={errors.transaction_date?.message} required>
          <Input {...register('transaction_date')} type="date" error={errors.transaction_date} />
        </FormField>
        <FormField label="Amount (₹)" error={errors.amount?.message} required>
          <Input {...register('amount')} type="number" step="0.01" placeholder="0.00" error={errors.amount} />
        </FormField>
      </div>

      <FormField label="Category" error={errors.category_id?.message} required>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select {...field} options={categoryOptions} placeholder="Select category" error={errors.category_id} />
          )}
        />
      </FormField>

      <FormField label="Vendor / Party" error={errors.vendor_id?.message}>
        <Controller
          name="vendor_id"
          control={control}
          render={({ field }) => (
            <Select {...field} options={vendorOptions} placeholder="Optional" error={errors.vendor_id} />
          )}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Payment Mode" error={errors.payment_mode?.message} required>
          <Controller
            name="payment_mode"
            control={control}
            render={({ field }) => (
              <Select {...field} options={PAYMENT_OPTIONS} placeholder="Select mode" error={errors.payment_mode} />
            )}
          />
        </FormField>
        <FormField label="Reference Type" error={errors.reference_type?.message}>
          <Controller
            name="reference_type"
            control={control}
            render={({ field }) => (
              <Select {...field} options={REF_TYPE_OPTIONS} error={errors.reference_type} />
            )}
          />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        <Input {...register('description')} placeholder="Optional notes" error={errors.description} />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Update' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}
