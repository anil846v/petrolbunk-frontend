import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { loanTransactionSchema } from '../../validations/loanTransactionSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useLoans } from '../../hooks/useLoans';

const TYPE_OPTIONS = [
  { value: 'DISBURSEMENT', label: 'Disbursement (money out)' },
  { value: 'REPAYMENT',    label: 'Repayment (money in)' },
];

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'UPI',  label: 'UPI' },
];

// fixedLoanId — pass when this form is opened from inside a specific loan's page.
// That hides the loan selector and pre-fills loan_id automatically.
export default function LoanTransactionForm({ defaultValues, onSubmit, loading, fixedLoanId }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(loanTransactionSchema, {
    defaultValues: { loan_id: fixedLoanId ?? '', ...defaultValues },
  });
  useFormErrorLogger(errors, 'LoanTransactionForm');

  useEffect(() => {
    reset({ loan_id: fixedLoanId ?? '', ...defaultValues });
  }, [defaultValues, fixedLoanId, reset]);

  const { options: loanOptions } = useLoans();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Hide loan selector when opened from inside a specific loan */}
      {!fixedLoanId && (
        <FormField label="Loan Account" error={errors.loan_id?.message} required>
          <Controller
            name="loan_id"
            control={control}
            render={({ field }) => (
              <Select {...field} options={loanOptions} placeholder="Select loan account" error={errors.loan_id} />
            )}
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type" error={errors.type?.message} required>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select {...field} options={TYPE_OPTIONS} placeholder="Select type" error={errors.type} />
            )}
          />
        </FormField>
        <FormField label="Date" error={errors.transaction_date?.message} required>
          <Input {...register('transaction_date')} type="date" error={errors.transaction_date} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Amount (₹)" error={errors.amount?.message} required>
          <Input {...register('amount')} type="number" step="0.01" placeholder="0.00" error={errors.amount} />
        </FormField>
        <FormField label="Payment Mode" error={errors.payment_mode?.message} required>
          <Controller
            name="payment_mode"
            control={control}
            render={({ field }) => (
              <Select {...field} options={PAYMENT_OPTIONS} placeholder="Select mode" error={errors.payment_mode} />
            )}
          />
        </FormField>
      </div>

      <FormField label="Remarks" error={errors.remarks?.message}>
        <Input {...register('remarks')} placeholder="Optional" error={errors.remarks} />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}
