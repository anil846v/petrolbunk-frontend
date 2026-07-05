import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { vendorSchema } from '../../validations/vendorSchema';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const TYPE_OPTIONS = [
  { value: 'CUSTOMER',         label: 'Customer' },
  { value: 'SUPPLIER',         label: 'Supplier' },
  { value: 'EMPLOYEE',         label: 'Employee' },
  { value: 'LOAN',             label: 'Loan Party' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'OTHER',            label: 'Other' },
];

export default function VendorForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useAppForm(vendorSchema, { defaultValues });
  useFormErrorLogger(errors, 'VendorForm');

  const [gstEnabled, setGstEnabled] = useState(!!defaultValues?.gst);

  useEffect(() => {
    reset(defaultValues ?? {});
    setGstEnabled(!!defaultValues?.gst);
  }, [defaultValues, reset]);

  const handleGstToggle = () => {
    const next = !gstEnabled;
    setGstEnabled(next);
    if (!next) setValue('gst', null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message} required>
        <Input {...register('name')} placeholder="e.g. Ram Traders" error={errors.name} />
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone" error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" placeholder="10-digit number" error={errors.phone} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="Optional" error={errors.email} />
        </FormField>
      </div>

      <FormField label="Address" error={errors.address?.message}>
        <Input {...register('address')} placeholder="Optional" error={errors.address} />
      </FormField>

      {/* GST section */}
      <div className="pt-2 border-t border-neutral-border">
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={gstEnabled}
            onChange={handleGstToggle}
            className="w-4 h-4 rounded border-neutral-border text-primary accent-primary"
          />
          <span className="text-sm font-medium text-neutral-text">GST Registered</span>
        </label>

        {gstEnabled && (
          <div className="mt-3">
            <FormField label="GST Number" error={errors.gst?.message}>
              <Input
                {...register('gst')}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="uppercase"
                error={errors.gst}
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Bank & Payment details */}
      <div className="pt-2 border-t border-neutral-border">
        <p className="text-sm font-medium text-neutral-text mb-3">Bank &amp; Payment Details</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Bank Name" error={errors.bank_name?.message}>
            <Input {...register('bank_name')} placeholder="e.g. State Bank of India" error={errors.bank_name} />
          </FormField>
          <FormField label="Account Number" error={errors.account_no?.message}>
            <Input {...register('account_no')} placeholder="Account number" error={errors.account_no} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="IFSC Code" error={errors.ifsc_code?.message}>
            <Input {...register('ifsc_code')} placeholder="e.g. SBIN0001234" className="uppercase" error={errors.ifsc_code} />
          </FormField>
          <FormField label="UPI ID" error={errors.phonepe?.message}>
            <Input {...register('phonepe')} placeholder="e.g. 9876543210@upi" error={errors.phonepe} />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Update Vendor' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  );
}
