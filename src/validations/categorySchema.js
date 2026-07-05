import * as yup from 'yup';

export const categorySchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Minimum 2 characters'),
  type: yup.string()
    .oneOf(['INCOME', 'EXPENSE'], 'Select a valid type')
    .required('Type is required'),
});
