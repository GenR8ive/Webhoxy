import { describe, it, expect } from 'vitest';
import { applyMappings } from './json-mapper.js';

describe('JSON Mapper', () => {
  it('should map simple field', () => {
    const source = { user: { name: 'John' } };
    const mappings = [
      {
        source_field: 'user.name',
        target_field: 'author',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ author: 'John' });
  });

  it('should map nested fields', () => {
    const source = {
      user: {
        profile: {
          name: 'John Doe',
        },
      },
    };
    const mappings = [
      {
        source_field: 'user.profile.name',
        target_field: 'author.fullName',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({
      author: {
        fullName: 'John Doe',
      },
    });
  });

  it('should use fixed value when provided', () => {
    const source = { user: { name: 'John' } };
    const mappings = [
      {
        source_field: '',
        target_field: 'source',
        fixed_value: 'webhoxy-proxy',
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ source: 'webhoxy-proxy' });
  });

  it('should handle multiple mappings', () => {
    const source = {
      event_type: 'deployment',
      user: {
        username: 'johndoe',
      },
    };
    const mappings = [
      {
        source_field: 'event_type',
        target_field: 'eventName',
        fixed_value: null,
      },
      {
        source_field: 'user.username',
        target_field: 'author.name',
        fixed_value: null,
      },
      {
        source_field: '',
        target_field: 'source',
        fixed_value: 'webhoxy',
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({
      eventName: 'deployment',
      author: {
        name: 'johndoe',
      },
      source: 'webhoxy',
    });
  });

  it('should skip mappings for missing fields', () => {
    const source = { user: { name: 'John' } };
    const mappings = [
      {
        source_field: 'user.email',
        target_field: 'email',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // With new error handling, missing fields are skipped instead of mapped to null
    expect(result).toEqual({});
  });

  it('should handle array access', () => {
    const source = {
      items: [
        { name: 'First' },
        { name: 'Second' },
      ],
    };
    const mappings = [
      {
        source_field: 'items.0.name',
        target_field: 'firstItem',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ firstItem: 'First' });
  });

  it('should combine multiple fields with space separator', () => {
    const source = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    const mappings = [
      {
        source_field: '[user.firstName] [user.lastName]',
        target_field: 'fullName',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ fullName: 'John Doe' });
  });

  it('should combine multiple fields with custom separator', () => {
    const source = {
      user: {
        name: 'John',
        email: 'john@example.com',
      },
    };
    const mappings = [
      {
        source_field: '[user.name], [user.email]',
        target_field: 'contact',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ contact: 'John, john@example.com' });
  });

  it('should combine fields with no separator', () => {
    const source = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    const mappings = [
      {
        source_field: '[user.firstName][user.lastName]',
        target_field: 'username',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ username: 'JohnDoe' });
  });

  it('should handle combined fields with missing values', () => {
    const source = {
      user: {
        firstName: 'John',
        // lastName is missing
      },
    };
    const mappings = [
      {
        source_field: '[user.firstName] [user.lastName]',
        target_field: 'fullName',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // Should still map with available fields, omitting missing ones
    expect(result).toEqual({ fullName: 'John' });
  });

  it('should skip combined fields when all values are missing', () => {
    const source = {
      user: {
        email: 'john@example.com',
      },
    };
    const mappings = [
      {
        source_field: '[user.firstName] [user.lastName]',
        target_field: 'fullName',
        fixed_value: null,
      },
      {
        source_field: 'user.email',
        target_field: 'contact',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // Should skip the combined field mapping but keep the valid one
    expect(result).toEqual({ contact: 'john@example.com' });
  });

  it('should stringify arrays automatically', () => {
    const source = {
      tags: ['javascript', 'typescript', 'nodejs'],
      user: { name: 'John' },
    };
    const mappings = [
      {
        source_field: 'tags',
        target_field: 'tagsList',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ 
      tagsList: JSON.stringify(['javascript', 'typescript', 'nodejs'])
    });
  });

  it('should stringify objects automatically', () => {
    const source = {
      user: {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      },
    };
    const mappings = [
      {
        source_field: 'user',
        target_field: 'userData',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ 
      userData: JSON.stringify({ name: 'John', age: 30, email: 'john@example.com' })
    });
  });

  it('should handle null values without stringifying', () => {
    const source = {
      value: null,
    };
    const mappings = [
      {
        source_field: 'value',
        target_field: 'output',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ output: null });
  });

  it('should keep primitive values as-is', () => {
    const source = {
      string: 'hello',
      number: 42,
      boolean: true,
    };
    const mappings = [
      {
        source_field: 'string',
        target_field: 'str',
        fixed_value: null,
      },
      {
        source_field: 'number',
        target_field: 'num',
        fixed_value: null,
      },
      {
        source_field: 'boolean',
        target_field: 'bool',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({ 
      str: 'hello',
      num: 42,
      bool: true,
    });
  });

  it('should handle array of objects with nested access (labels.0.id pattern)', () => {
    const source = {
      labels: [
        { id: 'label-123', name: 'Bug' },
        { id: 'label-456', name: 'Feature' },
      ],
      title: 'Test Issue',
    };
    const mappings = [
      {
        source_field: 'labels.0.id',
        target_field: 'firstLabelId',
        fixed_value: null,
      },
      {
        source_field: 'labels.0.name',
        target_field: 'firstLabelName',
        fixed_value: null,
      },
      {
        source_field: 'title',
        target_field: 'issueTitle',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({
      firstLabelId: 'label-123',
      firstLabelName: 'Bug',
      issueTitle: 'Test Issue',
    });
  });

  it('should gracefully skip mappings with missing source fields', () => {
    const source = { user: { name: 'John' } };
    const mappings = [
      {
        source_field: 'user.name',
        target_field: 'author',
        fixed_value: null,
      },
      {
        source_field: 'user.email', // missing
        target_field: 'email',
        fixed_value: null,
      },
      {
        source_field: 'user.age', // missing
        target_field: 'age',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // Should only include the mapping that had a valid source
    expect(result).toEqual({ author: 'John' });
  });

  it('should handle mappings with empty source_field gracefully', () => {
    const source = { user: { name: 'John' } };
    const mappings = [
      {
        source_field: 'user.name',
        target_field: 'author',
        fixed_value: null,
      },
      {
        source_field: '', // empty
        target_field: 'email',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // Should skip the invalid mapping
    expect(result).toEqual({ author: 'John' });
  });

  it('should handle complex nested array structures', () => {
    const source = {
      data: {
        items: [
          { 
            product: { id: 'prod-1', name: 'Item 1' },
            quantity: 5,
          },
          { 
            product: { id: 'prod-2', name: 'Item 2' },
            quantity: 3,
          },
        ],
      },
    };
    const mappings = [
      {
        source_field: 'data.items.0.product.name',
        target_field: 'firstProductName',
        fixed_value: null,
      },
      {
        source_field: 'data.items.0.quantity',
        target_field: 'firstQuantity',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    expect(result).toEqual({
      firstProductName: 'Item 1',
      firstQuantity: 5,
    });
  });

  it('should not crash on invalid mappings and continue with others', () => {
    const source = { user: { name: 'John', email: 'john@example.com' } };
    const mappings = [
      {
        source_field: 'user.name',
        target_field: 'author',
        fixed_value: null,
      },
      {
        source_field: 'invalid.deep.nested.path',
        target_field: 'invalid',
        fixed_value: null,
      },
      {
        source_field: 'user.email',
        target_field: 'contactEmail',
        fixed_value: null,
      },
    ];
    
    const result = applyMappings(source, mappings);
    
    // Should process valid mappings even if one fails
    expect(result).toEqual({
      author: 'John',
      contactEmail: 'john@example.com',
    });
  });
});

