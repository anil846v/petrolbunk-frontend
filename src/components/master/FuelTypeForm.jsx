import { useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { fuelTypeSchema } from '../../validations/fuelTypeSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const COMMISSION_OPTIONS = [
  { value: 'AMOUNT',  label: 'Fixed Amount (per litre)' },
  { value: 'PERCENT', label: 'Percentage (%)' },
];

export default function FuelTypeForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(fuelTypeSchema, { defaultValues });
  useFormErrorLogger(errors, 'FuelTypeForm');

  useEffect(() => { reset(defaultValues ?? {}); }, [defaultValues, reset]);

  const commissionType = useWatch({ control, name: 'commission_type' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fuel Type Name" error={errors.fuel_type?.message} required>
          <Input {...register('fuel_type')} placeholder="e.g. Petrol" error={errors.fuel_type} />
        </FormField>
        <FormField label="Code" error={errors.code?.message} required>
          <Input {...register('code')} placeholder="e.g. PET" className="uppercase" error={errors.code} />
        </FormField>
      </div>

      <FormField label="Price per Litre (₹)" error={errors.price_per_litre?.message} required>
        <Input {...register('price_per_litre')} type="number" step="0.01" placeholder="0.00" error={errors.price_per_litre} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="From Date" error={errors.from_date?.message} required>
          <Input {...register('from_date')} type="date" error={errors.from_date} />
        </FormField>
        <FormField label="To Date" error={errors.to_date?.message}>
          <Input {...register('to_date')} type="date" error={errors.to_date} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Commission Type" error={errors.commission_type?.message}>
          <Controller
            name="commission_type"
            control={control}
            render={({ field }) => (
              <Select {...field} options={COMMISSION_OPTIONS} placeholder="None" error={errors.commission_type} />
            )}
          />
        </FormField>

        {/* Only shown when commission type is selected */}
        {commissionType && (
          <FormField label="Commission Value" error={errors.commission_value?.message} required>
            <Input {...register('commission_value')} type="number" step="0.01" placeholder="0.00" error={errors.commission_value} />
          </FormField>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
