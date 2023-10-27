import { TextField, TextFieldProps } from '@mui/material';
import { useField } from 'formik';

type TextInputProps = TextFieldProps & {
  name: string;
};

/**
 * A Formik-bound MUI text field.
 *
 * Only the four values a TextField understands are taken from Formik's `meta`. Spreading
 * the whole `meta` object put `initialValue`, `initialTouched` and `initialError` on the
 * DOM node, which React reported as unknown-attribute warnings on every render.
 */
export const TextInput = ({ name, helperText, ...props }: TextInputProps): JSX.Element => {
  const [field, meta] = useField(name);
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <TextField
      margin="normal"
      fullWidth
      id={name}
      {...field}
      {...props}
      error={hasError}
      helperText={hasError ? meta.error : helperText}
    />
  );
};
