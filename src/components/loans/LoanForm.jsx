import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { loanSchema } from '../../validations/loanSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useVendors } from '../../hooks/useVendors';

const LOAN_TYPE_OPTIONS = [
  { value: 'GIVEN', label: 'Given (we lent money out)' },
  { value: 'TAKEN', label: 'Taken (we borrowed money)' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export default function LoanForm({ defaultValues, onSubmit, loading }) {
  const initialData = {
    start_date: todayStr(),
    ...defaultValues,
  };

  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(loanSchema, { 
    defaultValues: initialData,
  });
  useFormErrorLogger(errors, 'LoanForm');

  useEffect(() => { 
    reset({ 
      start_date: todayStr(),
      ...defaultValues,
    }); 
  }, [defaultValues, reset]);

  const { options: vendorOptions } = useVendors();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vendor / Party" error={errors.vendor_id?.message} required>
          <Controller
            name="vendor_id"
            control={control}
            render={({ field }) => (
              <Select {...field} options={vendorOptions} placeholder="Select vendor" error={errors.vendor_id} />
            )}
          />
        </FormField>

        <FormField label="Loan Type" error={errors.loan_type?.message} required>
          <Controller
            name="loan_type"
            control={control}
            render={({ field }) => (
              <Select {...field} options={LOAN_TYPE_OPTIONS} placeholder="Select type" error={errors.loan_type} />
            )}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Principal Amount (₹)" error={errors.principal_amount?.message} required>
          <Input {...register('principal_amount')} type="number" step="0.01" placeholder="0.00" error={errors.principal_amount} />
        </FormField>

        <FormField label="Interest (%)" error={errors.interest_percent?.message}>
          <Input {...register('interest_percent')} type="number" step="0.01" placeholder="0 for interest-free" error={errors.interest_percent} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Start Date" error={errors.start_date?.message} required>
          <Input {...register('start_date')} type="date" error={errors.start_date} />
        </FormField>
        <FormField label="End Date" error={errors.end_date?.message}>
          <Input {...register('end_date')} type="date" error={errors.end_date} />
        </FormField>
      </div>

      <FormField label="Remarks" error={errors.remarks?.message}>
        <Input {...register('remarks')} placeholder="Optional notes or reference details" error={errors.remarks} />
      </FormField>

      <div className="flex justify-end pt-3 border-t border-neutral-border mt-4">
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {defaultValues?.id ? 'Update Loan' : 'Create Loan'}
        </Button>
      </div>
    </form>
  );
}
