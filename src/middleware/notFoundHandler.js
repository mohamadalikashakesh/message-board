// /catch all requests that don't match any of the defined routes or endpoint

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    details: `The requested resource ${req.originalUrl} was not found`
  });
}; 