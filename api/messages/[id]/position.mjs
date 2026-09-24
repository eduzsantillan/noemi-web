import { invokeApi } from '../../_shared.mjs';

export default function handler(request, response) {
  return invokeApi(request, response, `/api/messages/${request.query.id}/position`);
}
