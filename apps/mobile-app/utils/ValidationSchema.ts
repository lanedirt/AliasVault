import * as Yup from 'yup';

/**
 * Credential add/edit form validation schema used by react-hook-form.
 * @param t - Translation function
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createCredentialSchema = (t: (key: string) => string) => Yup.object().shape({
  Id: Yup.string().optional(),
  ServiceName: Yup.string().required(t('validation.serviceNameRequired')),
  ServiceUrl: Yup.string().url(t('validation.invalidUrlFormat')).nullable().notRequired(),
  Alias: Yup.object().shape({
    FirstName: Yup.string().nullable().notRequired(),
    LastName: Yup.string().nullable().notRequired(),
    NickName: Yup.string().nullable().notRequired(),
    BirthDate: Yup.string()
      .nullable()
      .notRequired()
      .test(
        'is-valid-date-format',
        t('validation.invalidDateFormat'),
        value => {
          if (!value) {
            return true;
          } // allow empty
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
      ),
    Gender: Yup.string().nullable().notRequired(),
    Email: Yup.string().email(t('validation.invalidEmailFormat')).nullable().notRequired()
  }),
  Username: Yup.string().nullable().notRequired(),
  Password: Yup.string().nullable().notRequired(),
  Notes: Yup.string().nullable().notRequired()
});
