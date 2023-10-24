import { ResponseCodes } from '../interfaces/request';

const RESPONSE_CODES: ResponseCodes = {
  ok: 200,
  created: 201,
  badRequest: 400,
  authorizationError: 401,
  notFound: 404,
  conflictError: 409,
  serverError: 500,
};

export default RESPONSE_CODES;
