import * as yup from 'yup';
import { requiredDate } from './shared';

export const fuelSaleSchema = yup.object({
  sale_date:    requiredDate,
  fuel_type_id: yup.number().typeError('Select a fuel type').required('Fuel type is required'),

  opening_meter: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .required('Opening meter is required'),

  // Cross-field rule: closing must be greater than opening
  closing_meter: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .required('Closing meter is required')
    .test(
      'closing-greater-than-opening',
      'Closing meter must be greater than opening meter',
      function (val) {
        return val > this.parent.opening_meter;
      }
    ),

  opening_dip: yup.number().typeError('Must be a number').nullable().transform((v) => (v === '' || isNaN(v)) ? null : v),
  closing_dip: yup.number().typeError('Must be a number').nullable().transform((v) => (v === '' || isNaN(v)) ? null : v),
  remarks:     yup.string().nullable().transform((v) => v === '' ? null : v),
  payment_mode: yup.string().oneOf(['CASH', 'BANK', 'UPI']).default('CASH'),
});
