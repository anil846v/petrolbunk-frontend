import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// Wraps useForm with the project-standard config.
// Always use this instead of raw useForm in entity forms.
export function useAppForm(schema, options = {}) {
  return useForm({
    resolver:         yupResolver(schema),
    mode:             'onBlur',      // validate when user leaves a field
    reValidateMode:   'onChange',    // re-validate on change after first submit attempt
    ...options,
  });
}
