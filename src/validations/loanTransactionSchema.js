import * as yup from 'yup';
import { requiredDate, positiveAmount } from './shared';

export const loanTransactionSchema = yup.object({
  loan_id:          yup.number().typeError('Select a loan').required('Loan is required'),
  transaction_date: requiredDate,

  type: yup.string()
    .oneOf(['DISBURSEMENT', 'REPAYMENT'], 'Select a valid type')
    .required('Type is required'),

  amount: positiveAmount,

  payment_mode: yup.string()
    .oneOf(['CASH', 'BANK', 'UPI'], 'Select a valid payment mode')
    .required('Payment mode is required'),

  remarks: yup.string().nullable().transform((v) => v === '' ? null : v),
});
