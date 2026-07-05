import { useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';

import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { fuelSaleSchema } from '../../validations/fuelSaleSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

// LiveLitres is a separate component so only IT re-renders on meter changes.
// Never use bare watch() at the form level — it re-renders the whole form.
function LiveLitres({ control }) {
  const [opening, closing] = useWatch({ control, name: ['opening_meter', 'closing_meter'] });
  const litres = Math.max(0, (parseFloat(closing) || 0) - (parseFloat(opening) || 0));

  return (
    <div className="px-3 py-2 rounded-md bg-neutral-bg border border-neutral-border text-sm">
      Litres sold:{' '}
      <span className="font-semibold text-primary">
        {litres > 0 ? litres.toFixed(2) : '—'}
      </span>
    </div>
  );
}

export default function FuelSaleForm({ defaultValues, onSubmit, loading, fuelTypeOptions = [] }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(fuelSaleSchema, { defaultValues });
  useFormErrorLogger(errors, 'FuelSaleForm');

  useEffect(() => { reset(defaultValues ?? {}); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Sale Date" error={errors.sale_date?.message} required>
          <Input {...register('sale_date')} type="date" error={errors.sale_date} />
        </FormField>
        <FormField label="Fuel Type" error={errors.fuel_type_id?.message} required>
          <Controller
            name="fuel_type_id"
            control={control}
            render={({ field }) => (
              <Select {...field} options={fuelTypeOptions} placeholder="Select fuel type" error={errors.fuel_type_id} />
            )}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Opening Meter" error={errors.opening_meter?.message} required>
          <Input {...register('opening_meter')} type="number" step="0.01" placeholder="0.00" error={errors.opening_meter} />
        </FormField>
        <FormField label="Closing Meter" error={errors.closing_meter?.message} required>
          <Input {...register('closing_meter')} type="number" step="0.01" placeholder="0.00" error={errors.closing_meter} />
        </FormField>
      </div>

      {/* Live preview — scoped child, zero impact on form re-renders */}
      <LiveLitres control={control} />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Opening Dip" error={errors.opening_dip?.message}>
          <Input {...register('opening_dip')} type="number" step="0.01" placeholder="Optional" error={errors.opening_dip} />
        </FormField>
        <FormField label="Closing Dip" error={errors.closing_dip?.message}>
          <Input {...register('closing_dip')} type="number" step="0.01" placeholder="Optional" error={errors.closing_dip} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Payment Mode" error={errors.payment_mode?.message} required>
          <Controller
            name="payment_mode"
            control={control}
            defaultValue="CASH"
            render={({ field }) => (
              <Select {...field} options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK', label: 'Bank Transfer' },
                { value: 'UPI',  label: 'UPI' },
              ]} error={errors.payment_mode} />
            )}
          />
        </FormField>
        <FormField label="Remarks" error={errors.remarks?.message}>
          <Input {...register('remarks')} placeholder="Optional notes" error={errors.remarks} />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Update Entry' : 'Save Entry'}
        </Button>
      </div>
    </form>
  );
}
