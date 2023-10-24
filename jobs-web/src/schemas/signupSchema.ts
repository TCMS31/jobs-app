import * as Yup from 'yup';

export const signupSchema = Yup.object().shape({
  name: Yup.string().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});
