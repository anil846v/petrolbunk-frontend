import * as yup from 'yup';
import { phone10, optionalEmail } from './shared';

export const vendorSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Minimum 2 characters'),
  type: yup.string()
    .oneOf(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'LOAN', 'SERVICE_PROVIDER', 'OTHER'], 'Select a valid type')
    .required('Type is required'),
  phone:   phone10,
  email:   optionalEmail,
  address: yup.string().nullable().transform((v) => v === '' ? null : v),
  notes:   yup.string().nullable().transform((v) => v === '' ? null : v),

  gst: yup.string()
    .nullable()
    .transform((v) => v === '' ? null : v)
    .max(15, 'Max 15 characters'),

  bank_name:  yup.string().nullable().transform((v) => v === '' ? null : v),
  account_no: yup.string().nullable().transform((v) => v === '' ? null : v),
  ifsc_code:  yup.string().nullable().transform((v) => v === '' ? null : v).max(11, 'Max 11 characters'),
  phonepe:    yup.string().nullable().transform((v) => v === '' ? null : v),
});
