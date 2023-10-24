// Manual mock for axios. Jest picks this up automatically for every test, so no test can
// make a real network call.
const mockAxios = jest.createMockFromModule('axios');

// The interceptors registered by baseService are recorded rather than discarded, so tests
// can invoke the real ones and assert on what they do to a request or an error.
const registered = {
  request: [],
  response: [],
};

mockAxios.create = jest.fn(() => mockAxios);

mockAxios.interceptors = {
  request: {
    use: jest.fn((onFulfilled, onRejected) => registered.request.push({ onFulfilled, onRejected })),
  },
  response: {
    use: jest.fn((onFulfilled, onRejected) => registered.response.push({ onFulfilled, onRejected })),
  },
};

mockAxios.registeredInterceptors = registered;

mockAxios.isAxiosError = (error) => Boolean(error && error.isAxiosError);

mockAxios.get = jest.fn();
mockAxios.post = jest.fn();
mockAxios.patch = jest.fn();
mockAxios.put = jest.fn();
mockAxios.delete = jest.fn();

export default mockAxios;
