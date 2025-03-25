export function checkRequiredProperties(obj, requiredProps) {
   
  if (typeof obj !== 'object' || obj === null) {
    
    return { validation: false, textError: 'Invalid object or missing required properties' };
  }
  else
  {
    const missingProps = requiredProps.filter(prop => !Object.prototype.hasOwnProperty.call(obj, prop));
    
    if (missingProps.length > 0) {
      return { validation: false, textError: `Missing required properties: ${missingProps.join(', ')}` };
    }
  } 

  return { validation: true, textError: '' };
};
