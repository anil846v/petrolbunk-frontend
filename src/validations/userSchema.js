import * as yup from 'yup';
import { phone10 } from './shared';

// Create — password required
export const createUserSchema = yup.object({
  username: yup.string().required('Username is required').min(3, 'Minimum 3 characters'),
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
  role:     yup.string().oneOf(['ADMIN', 'STAFF'], 'Select a valid role').required('Role is required'),
  phone_no: phone10,
});

// Update — password not sent, only profile fields
export const updateUserSchema = yup.object({
  username: yup.string().required('Username is required').min(3, 'Minimum 3 characters'),
  email:    yup.string().email('Invalid email').required('Email is required'),
  role:     yup.string().oneOf(['ADMIN', 'STAFF'], 'Select a valid role').required('Role is required'),
  phone_no: phone10,
});

// Separate reset-password form
export const resetPasswordSchema = yup.object({
  new_password: yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
  confirm_password: yup.string()
    .required('Please confirm password')
    .oneOf([yup.ref('new_password')], 'Passwords do not match'),
});
