import { describe, it, expect } from 'vitest';
import { extractFieldPaths, extractFieldsWithInfo } from './field-extractor.js';

describe('Field Extractor', () => {
  describe('extractFieldPaths', () => {
    it('should extract simple fields', () => {
      const obj = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };
      
      const paths = extractFieldPaths(obj);
      
      expect(paths).toEqual(['name', 'age', 'email']);
    });

    it('should extract nested fields', () => {
      const obj = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            location: 'NYC',
          },
        },
      };
      
      const paths = extractFieldPaths(obj);
      
      expect(paths).toEqual([
        'user.name',
        'user.profile.age',
        'user.profile.location',
      ]);
    });

    it('should handle arrays', () => {
      const obj = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      };
      
      const paths = extractFieldPaths(obj);
      
      expect(paths).toContain('users');
      expect(paths).toContain('users.0.name');
      expect(paths).toContain('users.0.age');
    });

    it('should handle complex nested structures', () => {
      const obj = {
        event: 'push',
        repository: {
          name: 'myrepo',
          owner: {
            login: 'john',
          },
        },
        commits: [
          {
            message: 'Initial commit',
            author: {
              name: 'John',
            },
          },
        ],
      };
      
      const paths = extractFieldPaths(obj);
      
      expect(paths).toContain('event');
      expect(paths).toContain('repository.name');
      expect(paths).toContain('repository.owner.login');
      expect(paths).toContain('commits');
      expect(paths).toContain('commits.0.message');
      expect(paths).toContain('commits.0.author.name');
    });
  });

  describe('extractFieldsWithInfo', () => {
    it('should extract fields with type and sample data', () => {
      const obj = {
        name: 'John',
        age: 30,
        active: true,
      };
      
      const fields = extractFieldsWithInfo(obj);
      
      expect(fields).toContainEqual({
        path: 'name',
        type: 'string',
        sample: 'John',
      });
      
      expect(fields).toContainEqual({
        path: 'age',
        type: 'number',
        sample: 30,
      });
      
      expect(fields).toContainEqual({
        path: 'active',
        type: 'boolean',
        sample: true,
      });
    });

    it('should handle arrays with type information', () => {
      const obj = {
        items: ['a', 'b', 'c'],
        users: [{ name: 'John' }],
      };
      
      const fields = extractFieldsWithInfo(obj);
      
      const itemsField = fields.find((f) => f.path === 'items');
      expect(itemsField).toEqual({
        path: 'items',
        type: 'array (→ JSON string)',
        sample: JSON.stringify(['a', 'b', 'c']),
      });
      
      const usersField = fields.find((f) => f.path === 'users');
      expect(usersField).toEqual({
        path: 'users',
        type: 'array (→ JSON string)',
        sample: JSON.stringify([{ name: 'John' }]),
      });
    });

    it('should handle objects with stringified indication', () => {
      const obj = {
        metadata: {
          version: '1.0',
          author: 'John',
          tags: ['js', 'ts'],
        },
      };
      
      const fields = extractFieldsWithInfo(obj);
      
      const metadataField = fields.find((f) => f.path === 'metadata');
      expect(metadataField).toMatchObject({
        path: 'metadata',
        type: 'object (→ JSON string)',
      });
      expect(metadataField?.sample).toContain('version');
    });

    it('should truncate long arrays in sample', () => {
      const obj = {
        items: [1, 2, 3, 4, 5, 6, 7, 8],
      };
      
      const fields = extractFieldsWithInfo(obj);
      
      const itemsField = fields.find((f) => f.path === 'items');
      expect(itemsField?.type).toBe('array (→ JSON string)');
      expect(itemsField?.sample).toContain('...');
    });
  });
});

