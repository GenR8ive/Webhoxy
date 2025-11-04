interface Mapping {
  source_field: string;
  target_field: string;
  fixed_value: string | null;
}

/**
 * Applies field mappings to transform source JSON to target JSON
 */
export function applyMappings(source: any, mappings: Mapping[]): any {
  // Check if this is a JSON editor template mapping
  const jsonEditorMapping = mappings.find(m => m.target_field === '_json_editor');
  
  if (jsonEditorMapping && jsonEditorMapping.fixed_value) {
    // This is a JSON editor template - process it differently
    try {
      const template = jsonEditorMapping.fixed_value;
      
      // Replace all {{field.path}} with actual values from source
      const processed = template.replace(/\{\{([^}]+)\}\}/g, (_match, fieldPath) => {
        const value = extractField(source, fieldPath.trim());
        
        if (value === null || value === undefined) {
          console.warn(`Field '${fieldPath}' not found in source, using empty string`);
          return '';
        }
        
        // If value is an object or array, return as JSON string
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        
        return String(value);
      });
      
      // Parse and return the processed template
      return JSON.parse(processed);
    } catch (error) {
      console.error('Error processing JSON editor template:', error);
      // Fall through to regular mapping
    }
  }
  
  // Regular field-by-field mapping
  const target: Record<string, any> = {};
  
  for (const mapping of mappings) {
    // Skip the JSON editor mapping as it's already processed above
    if (mapping.target_field === '_json_editor') {
      continue;
    }
    
    try {
      let value: any;
      
      if (mapping.fixed_value !== null && mapping.fixed_value !== undefined) {
        // Use fixed value if provided
        try {
          value = JSON.parse(mapping.fixed_value);
        } catch {
          value = mapping.fixed_value;
        }
      } else {
        if (!mapping.source_field) {
          console.warn(`Mapping has no source field, skipping: ${JSON.stringify(mapping)}`);
          continue;
        }
        
        // Check if this is a combined field (format: [field1]separator[field2])
        if (mapping.source_field.startsWith('[') && mapping.source_field.includes('][')) {
          value = extractCombinedFields(source, mapping.source_field);
        } else {
          // Extract value from source JSON using the source_field path
          value = extractField(source, mapping.source_field);
        }
      }
      
      // Skip if value is null/undefined and this is not a fixed value
      if ((value === null || value === undefined) && !mapping.fixed_value) {
        console.warn(`Field '${mapping.source_field}' not found in source, skipping mapping to '${mapping.target_field}'`);
        continue;
      }
      
      // Insert into target JSON using the target_field path
      if (mapping.target_field) {
        insertField(target, mapping.target_field, value);
      }
    } catch (error) {
      // Log error but continue with other mappings
      console.error(`Error applying mapping ${mapping.source_field} -> ${mapping.target_field}:`, error);
    }
  }
  
  return target;
}

/**
 * Extract and combine multiple fields with separator
 * Format: [field1]separator[field2][field3]...
 * Returns null if no valid values are found
 */
function extractCombinedFields(json: any, combinedPath: string): string | null {
  // Parse the combined format
  const regex = /\[([^\]]+)\]/g;
  const matches = Array.from(combinedPath.matchAll(regex));
  
  if (matches.length === 0) {
    return null;
  }
  
  const fields = matches.map(m => m[1]);
  const separators: string[] = [];
  
  // Extract separators between fields
  let lastIndex = 0;
  matches.forEach((match, i) => {
    if (i > 0) {
      const start = combinedPath.indexOf(']', lastIndex) + 1;
      const end = combinedPath.indexOf('[', start);
      separators.push(combinedPath.substring(start, end));
    }
    lastIndex = match.index! + match[0].length;
  });
  
  // Extract values and combine, tracking which fields are missing
  const missingFields: string[] = [];
  const values = fields.map(field => {
    const val = extractField(json, field);
    if (val === null || val === undefined) {
      missingFields.push(field);
      return '';
    }
    return String(val);
  }).filter(v => v !== '');
  
  // If all fields are missing, log which ones and return null
  if (values.length === 0) {
    console.warn(`Combined field mapping failed: all fields are missing [${missingFields.join(', ')}]`);
    return null;
  }
  
  // If some fields are missing, log but continue with available values
  if (missingFields.length > 0) {
    console.info(`Some fields missing in combined mapping [${missingFields.join(', ')}], using available fields`);
  }
  
  // Join with appropriate separators
  return values.reduce((acc, val, i) => {
    if (i === 0) return val;
    const sep = separators[i - 1] || ' ';
    return acc + sep + val;
  }, '');
}

/**
 * Extract a field from JSON using dot notation path (e.g., "user.name")
 * Arrays and objects are automatically stringified
 */
function extractField(json: any, path: string): any {
  if (!path) return null;
  
  const parts = path.split('.');
  let current = json;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    
    if (Array.isArray(current)) {
      // Handle array index access
      const index = parseInt(part, 10);
      if (isNaN(index)) {
        return null;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = current[part];
    } else {
      return null;
    }
  }
  
  // Stringify arrays and objects (except null) to make them safely usable
  if (current !== null && current !== undefined && typeof current === 'object') {
    return JSON.stringify(current);
  }
  
  return current;
}

/**
 * Insert a value into a JSON object using dot notation path
 */
function insertField(target: Record<string, any>, path: string, value: any): void {
  if (!path || !path.trim()) {
    throw new Error('Path cannot be empty');
  }
  
  const parts = path.split('.');
  
  if (parts.length === 1) {
    target[parts[0]] = value;
    return;
  }
  
  // Handle nested paths
  let current = target;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (!part || part.trim() === '') {
      throw new Error(`Invalid path segment in '${path}'`);
    }
    
    // Create nested object if it doesn't exist
    if (!(part in current)) {
      current[part] = {};
    } else if (typeof current[part] !== 'object' || current[part] === null) {
      // If the path segment exists but is not an object, we can't traverse further
      console.warn(`Cannot set nested path '${path}': '${parts.slice(0, i + 1).join('.')}' is not an object`);
      return;
    }
    
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  if (!lastPart || lastPart.trim() === '') {
    throw new Error(`Invalid path: '${path}' ends with empty segment`);
  }
  
  current[lastPart] = value;
}

