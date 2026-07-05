import * as yup from 'yup';
import { requiredDate } from './shared';

export const fuelTypeSchema = yup.object({
  fuel_type: yup.string().required('Fuel type name is required'),
  code:      yup.string().required('Code is required').max(10, 'Max 10 characters'),

  price_per_litre: yup
    .number()
    .typeError('Must be a number')
    .positive('Must be greater than 0')
    .required('Price is required'),

  from_date: requiredDate,
  to_date:   yup.string().nullable().transform((v) => v === '' ? null : v),

  commission_type: yup.string()
    .oneOf(['AMOUNT', 'PERCENT', ''], 'Invalid type')
    .nullable()
    .transform((v) => v === '' ? null : v),

  // Required only when commission_type is set
  commission_value: yup
    .number()
    .typeError('Must be a number')
    .nullable()
    .transform((v) => (v === '' || isNaN(v)) ? null : v)
    .when('commission_type', {
      is:   (val) => val === 'AMOUNT' || val === 'PERCENT',
      then: (s)   => s.positive('Must be greater than 0').required('Commission value is required'),
    }),
});
