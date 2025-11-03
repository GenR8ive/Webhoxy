/**
 * Extract all field paths from a JSON object using dot notation
 * 
 * Example: { user: { name: "John", age: 30 } }
 * Returns: ["user.name", "user.age"]
 */
export function extractFieldPaths(obj: any, prefix = ''): string[] {
  const paths: string[] = [];
  
  if (obj === null || obj === undefined) {
    return paths;
  }
  
  if (Array.isArray(obj)) {
    // For arrays, show example of first item
    if (obj.length > 0) {
      const arrayPaths = extractFieldPaths(obj[0], `${prefix}.0`);
      paths.push(...arrayPaths);
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (value === null || value === undefined) {
          paths.push(currentPath);
        } else if (Array.isArray(value)) {
          // Show array itself as a field
          paths.push(currentPath);
          // Also show structure of first item
          if (value.length > 0 && typeof value[0] === 'object') {
            const arrayPaths = extractFieldPaths(value[0], `${currentPath}.0`);
            paths.push(...arrayPaths);
          }
        } else if (typeof value === 'object') {
          // Recursively extract nested fields
          const nestedPaths = extractFieldPaths(value, currentPath);
          paths.push(...nestedPaths);
        } else {
          // Primitive value - this is a leaf field
          paths.push(currentPath);
        }
      }
    }
  }
  
  return paths;
}

/**
 * Extract field information with sample values
 */
export interface FieldInfo {
  path: string;
  type: string;
  sample?: any;
}

export function extractFieldsWithInfo(obj: any, prefix = ''): FieldInfo[] {
  const fields: FieldInfo[] = [];
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const arrayFields = extractFieldsWithInfo(obj[0], `${prefix}.0`);
      fields.push(...arrayFields);
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (value === null || value === undefined) {
          fields.push({
            path: currentPath,
            type: 'null',
            sample: null,
          });
        } else if (Array.isArray(value)) {
          fields.push({
            path: currentPath,
            type: 'array (→ JSON string)',
            sample: JSON.stringify(value.length > 3 ? [...value.slice(0, 3), '...'] : value),
          });
          
          if (value.length > 0 && typeof value[0] === 'object') {
            const arrayFields = extractFieldsWithInfo(value[0], `${currentPath}.0`);
            fields.push(...arrayFields);
          }
        } else if (typeof value === 'object') {
          // Show object field with indication it will be stringified
          fields.push({
            path: currentPath,
            type: 'object (→ JSON string)',
            sample: `{${Object.keys(value).slice(0, 3).join(', ')}${Object.keys(value).length > 3 ? ', ...' : ''}}`,
          });
          
          const nestedFields = extractFieldsWithInfo(value, currentPath);
          fields.push(...nestedFields);
        } else {
          fields.push({
            path: currentPath,
            type: typeof value,
            sample: value,
          });
        }
      }
    }
  }
  
  return fields;
}

