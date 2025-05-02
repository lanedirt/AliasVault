import * as Yup from 'yup';

/**
 * Credential add/edit form validation schema used by react-hook-form.
 */
export const credentialSchema = Yup.object().shape({
  Id: Yup.string().optional(),
  ServiceName: Yup.string().required('Service name is required'),
  ServiceUrl: Yup.string().url('Invalid URL format').nullable().notRequired(),
  Alias: Yup.object().shape({
    FirstName: Yup.string().nullable().notRequired(),
    LastName: Yup.string().nullable().notRequired(),
    NickName: Yup.string().nullable().notRequired(),
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
    Gender: Yup.string().nullable().notRequired(),
    Email: Yup.string().email('Invalid email format').nullable().notRequired()
  }),
  Username: Yup.string().nullable().notRequired(),
  Password: Yup.string().nullable().notRequired(),
  Notes: Yup.string().nullable().notRequired()
});
