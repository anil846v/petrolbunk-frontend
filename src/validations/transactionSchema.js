import * as yup from 'yup';
import { requiredDate, positiveAmount } from './shared';

export const transactionSchema = yup.object({
  transaction_date: requiredDate,
  category_id:      yup.number().typeError('Select a category').required('Category is required'),
  vendor_id:        yup.number().typeError('Invalid vendor').nullable().transform((v) => (v === '' || isNaN(v)) ? null : v),
  amount:           positiveAmount,

  payment_mode: yup.string()
    .oneOf(['CASH', 'BANK', 'UPI'], 'Select a valid payment mode')
    .required('Payment mode is required'),

  reference_type: yup.string()
    .oneOf(['FUEL', 'LOAN', 'MANUAL'])
    .default('MANUAL'),

  description: yup.string().nullable().transform((v) => v === '' ? null : v),
});
