import * as yup from 'yup';
import { requiredDate } from './shared';

export const loanSchema = yup.object({
  vendor_id: yup.number().typeError('Select a vendor').required('Vendor is required'),

  loan_type: yup.string()
    .oneOf(['GIVEN', 'TAKEN'], 'Select a valid loan type')
    .required('Loan type is required'),

  principal_amount: yup
    .number()
    .typeError('Must be a number')
    .positive('Must be greater than 0')
    .required('Principal amount is required'),

  interest_percent: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%')
    .nullable()
    .transform((v) => (v === '' || isNaN(v)) ? null : v),

  start_date: requiredDate,

  // Cross-field rule: end date must be after start date
  end_date: yup.string()
    .nullable()
    .transform((v) => v === '' ? null : v)
    .test(
      'end-after-start',
      'End date must be after start date',
      function (val) {
        if (!val || !this.parent.start_date) return true;
        return new Date(val) > new Date(this.parent.start_date);
      }
    ),

  remarks: yup.string().nullable().transform((v) => v === '' ? null : v),
});
