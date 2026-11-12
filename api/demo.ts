import { apiHandler, sendJson } from '../src/server/http/response.js'

// Fixed demonstration data: this route does not read or write MongoDB.
export default apiHandler('GET', (request, response) => {
  sendJson(request, response, 200, {
    message: 'Hello from the First Light backend.',
    data: [{ id: 'demo-1', title: 'Example research source', status: 'demo' }],
  })
})
