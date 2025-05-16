/**
 * Handles standard errors for API controllers
 * @param {Response} res - Express response object
 * @param {Error} error - Captured error
 * @param {string} defaultMessage - Default message if no specific one is provided
 * @returns {Response} HTTP response with the formatted error
 */
export function handleControllerError(res, error, defaultMessage = 'Internal server error') {
  // If the error comes from an external HTTP request (like Grafana)
  if (error.response) {
    const { status, statusText, data } = error.response;
    return res.status(status).json({
      message: statusText ? `${defaultMessage}: ${statusText}` : defaultMessage,
      error: data?.message || error.message
    });
  }
  
  // Internal server error
  return res.status(500).json({
    message: defaultMessage,
    error: error.message
  });
}
