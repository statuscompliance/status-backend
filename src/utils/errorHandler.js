/**
 * Handles standard errors for API controllers
 * @param {Response} res - Express response object
 * @param {Error} error - Captured error
 * @param {string} defaultMessage - Default message if no specific one is provided
 * @returns {Response} HTTP response with the formatted error
 */
export const handleControllerError = (res, error, defaultMessage = 'Internal server error') => {
  console.error(error);
  
  // Handle external API errors with response property
  if (error.response) {
    const status = error.response.status || 500;
    const message = error.response.statusText 
      ? `${defaultMessage}: ${error.response.statusText}`
      : defaultMessage;
    const errorMessage = (error.response.data && error.response.data.message) || error.message;

    return res.status(status).json({
      message,
      error: errorMessage
    });
  }
  
  // Handle internal errors
  return res.status(500).json({
    message: defaultMessage,
    error: error.message
  });
};
