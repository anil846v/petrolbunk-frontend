import { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Camera, X, User as UserIcon, Loader2, UploadCloud } from 'lucide-react';
import { useAppForm } from '../../hooks/useAppForm';
import { useFormErrorLogger } from '../../hooks/useFormErrorLogger';
import { createUserSchema, updateUserSchema } from '../../validations/userSchema';
import { compressProfileImage, validateImageFile } from '../../utils/imageCompression';
import { getFileUrl } from '../../utils/api';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

// Admin-only form — the parent page must guard access by role, not this component
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
];

export default function UserForm({ defaultValues, onSubmit, loading, isSelf = false }) {
  const isEdit = !!defaultValues?.id;
  const schema = isEdit ? updateUserSchema : createUserSchema;

  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [fileError, setFileError] = useState('');
  const [removedPhoto, setRemovedPhoto] = useState(false);
  const [compressedSize, setCompressedSize] = useState(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useAppForm(schema, { defaultValues });
  useFormErrorLogger(errors, 'UserForm');

  useEffect(() => {
    reset(defaultValues ?? {});
    if (defaultValues?.profile_image) {
      setPreviewUrl(getFileUrl(defaultValues.profile_image));
      setRemovedPhoto(false);
    } else {
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setCompressedSize(null);
    setFileError('');
  }, [defaultValues, reset]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');

    // 1. Initial 2MB limit validation
    const validation = validateImageFile(file, 2);
    if (!validation.valid) {
      setFileError(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Client-side compression & resizing
    setCompressing(true);
    try {
      const compressed = await compressProfileImage(file);
      setSelectedFile(compressed);
      setCompressedSize((compressed.size / 1024).toFixed(0));
      setRemovedPhoto(false);

      // Create preview URL
      const objectUrl = URL.createObjectURL(compressed);
      setPreviewUrl(objectUrl);
    } catch (err) {
      setFileError(err.message || 'Failed to compress image');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCompressedSize(null);
    setFileError('');
    setRemovedPhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        formData.append(key, val);
      }
    });

    if (selectedFile) {
      formData.append('profile_image', selectedFile);
    } else if (removedPhoto) {
      formData.append('remove_profile_image', 'true');
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      {/* Profile Photo Upload Field */}
      <div className="flex flex-col items-center justify-center p-3 bg-neutral-50/60 rounded-xl border border-neutral-100 mb-2">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-2 border-primary-200 overflow-hidden bg-neutral-100 flex items-center justify-center shadow-inner">
            {compressing ? (
              <div className="flex flex-col items-center justify-center text-primary-600 gap-1">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-[10px] font-medium">Shrinking...</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl(null)}
              />
            ) : (
              <UserIcon size={38} className="text-neutral-400" />
            )}
          </div>

          {/* Camera upload overlay trigger */}
          {!compressing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-colors"
              title="Upload / Change Photo"
              aria-label="Upload photo"
            >
              <Camera size={14} />
            </button>
          )}

          {/* Remove photo button */}
          {!compressing && previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-0 right-0 p-1 rounded-full bg-danger-600 text-white shadow hover:bg-danger-700 transition-colors"
              title="Remove Photo"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
          >
            <UploadCloud size={13} />
            {previewUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
          </button>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Max 2 MB (JPG, PNG, WebP) • Auto-compressed to &lt; 1 MB
          </p>
          {compressedSize && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-50 text-success-700 border border-success-200">
              Compressed to {compressedSize} KB
            </span>
          )}
          {fileError && (
            <p className="text-xs text-danger-600 mt-1 font-medium">{fileError}</p>
          )}
        </div>
      </div>

      <FormField label="Username" error={errors.username?.message} required>
        <Input {...register('username')} placeholder="e.g. john_doe" error={errors.username} />
      </FormField>

      <FormField label="Email" error={errors.email?.message} required>
        <Input {...register('email')} type="email" placeholder="e.g. john@example.com" error={errors.email} />
      </FormField>

      {!isEdit && (
        <FormField label="Password" error={errors.password?.message} required>
          <Input {...register('password')} type="password" placeholder="Min 6 characters" error={errors.password} />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Role" error={errors.role?.message} required>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select 
                {...field} 
                options={ROLE_OPTIONS} 
                placeholder="Select role" 
                error={errors.role} 
                disabled={isSelf} 
              />
            )}
          />
          {isSelf && (
            <span className="text-[11px] text-neutral-400 mt-0.5">Role cannot be changed for your own account</span>
          )}
        </FormField>

        <FormField label="Phone" error={errors.phone_no?.message}>
          <Input {...register('phone_no')} type="tel" placeholder="10-digit number" error={errors.phone_no} />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading || compressing}>
          {isEdit ? 'Update' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
