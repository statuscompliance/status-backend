/**
 * Creates a standardized GET request helper
 * @param {Object} request - Supertest request object
 * @param {string} path - Request path
 * @param {string} [token] - Optional authentication token
 * @returns {Object} Supertest request
 */
export function getRequest(request, path, token) {
  const req = request.get(path);
  if (token) {
    req.set('Cookie', `accessToken=${token}`);
  }
  return req;
}

/**
 * Creates a standardized POST request helper
 * @param {Object} request - Supertest request object
 * @param {string} path - Request path
 * @param {string} [token] - Optional authentication token
 * @param {Object} [body] - Optional request body
 * @returns {Object} Supertest request
 */
export function postRequest(request, path, token, body) {
  const req = request.post(path);
  if (token) {
    req.set('Cookie', `accessToken=${token}`);
  }
  if (body !== undefined) {
    req.send(body);
  }
  return req;
}

/**
 * Creates a standardized PUT request helper
 * @param {Object} request - Supertest request object
 * @param {string} path - Request path
 * @param {string} [token] - Optional authentication token
 * @param {Object} [body] - Optional request body
 * @returns {Object} Supertest request
 */
export function putRequest(request, path, token, body) {
  const req = request.put(path);
  if (token) {
    req.set('Cookie', `accessToken=${token}`);
  }
  if (body !== undefined) {
    req.send(body);
  }
  return req;
}

/**
 * Creates a standardized DELETE request helper
 * @param {Object} request - Supertest request object
 * @param {string} path - Request path
 * @param {string} [token] - Optional authentication token
 * @returns {Object} Supertest request
 */
export function deleteRequest(request, path, token) {
  const req = request.delete(path);
  if (token) {
    req.set('Cookie', `accessToken=${token}`);
  }
  return req;
}

/**
 * Factory to create request helpers bound to a specific request object
 * @param {Object} request - Supertest request object
 * @returns {Object} Object containing bound request helpers
 */
export function createRequestHelpers(request) {
  return {
    get: (path, token) => getRequest(request, path, token),
    post: (path, token, body) => postRequest(request, path, token, body),
    put: (path, token, body) => putRequest(request, path, token, body),
    delete: (path, token) => deleteRequest(request, path, token),
  };
}
