import * as Yup from 'yup';

/**
 * Credential add/edit form validation schema used by react-hook-form.
 */
export const credentialSchema = Yup.object().shape({
  ServiceName: Yup.string().required('Service name is required'),
  ServiceUrl: Yup.string().url('Invalid URL format').optional(),
  Alias: Yup.object().shape({
    FirstName: Yup.string().optional(),
    LastName: Yup.string().optional(),
    NickName: Yup.string().optional(),
    BirthDate: Yup.string()
    .nullable()
    .notRequired()
    .test(
      'is-valid-date-format',
      'Date must be in YYYY-MM-DD format',
      value => {
        if (!value) return true; // allow empty
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      },
    ),
    Gender: Yup.string().optional(),
    Email: Yup.string().email('Invalid email format').optional()
  }),
  Username: Yup.string().optional(),
  Password: Yup.string().nullable().notRequired(),
  Notes: Yup.string().optional()
});
