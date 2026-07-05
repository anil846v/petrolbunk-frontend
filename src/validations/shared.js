import * as yup from 'yup';

// Common Yup fragments reused across all entity schemas.
// Import what you need — never duplicate these rules.

export const positiveAmount = yup
  .number()
  .typeError('Must be a number')
  .positive('Must be greater than 0')
  .required('Amount is required');

export const requiredDate = yup
  .string()
  .required('Date is required');

// 10-digit phone — optional field
export const phone10 = yup
  .string()
  .matches(/^\d{10}$/, 'Must be exactly 10 digits')
  .nullable()
  .transform((v) => v === '' ? null : v);

// Email — optional field
export const optionalEmail = yup
  .string()
  .email('Invalid email address')
  .nullable()
  .transform((v) => v === '' ? null : v);
