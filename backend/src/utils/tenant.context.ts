/**
 * Tenant Context - Module 29
 * 
 * Provides a Prisma Client Extension that automatically injects tenant scope (`instituteId`) 
 * into queries for tenant-owned models. This ensures that a developer cannot accidentally 
 * leak data from one institution to another.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as basePrisma } from './prisma';

// Define which models in the schema are strictly owned by a tenant (Institute).
// These models either have `instituteId` directly, or we can scope them.
// Note: For full safety, models like AttendanceRecord could be scoped by joining their session,
// but for performance, we ideally want `instituteId` on the core entities.
// In our schema, Student, Faculty, Department, Class have `instituteId`.
const TENANT_MODELS = [
  'Student',
  'Faculty',
  'Department',
  'Class',
  'User' // Only if they belong to an institute
] as const;

export function getTenantPrisma(tenantId: string | null) {
  if (!tenantId) {
    // If no tenantId is provided (e.g., SUPER_ADMIN doing global operations), return the base client.
    return basePrisma;
  }

  // Use Prisma Client Extensions to automatically add `where: { instituteId: tenantId }`
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Check if this model is one of the tenant-owned models
          if (TENANT_MODELS.includes(model as any)) {
            // Determine if the operation is a read or write that needs filtering
            const readOperations = ['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'];
            const writeOperations = ['update', 'updateMany', 'delete', 'deleteMany'];
            
            const anyArgs = args as any;
            if (readOperations.includes(operation) || writeOperations.includes(operation)) {
              anyArgs.where = {
                ...anyArgs.where,
                instituteId: tenantId
              };
            }

            if (operation === 'create' || operation === 'createMany') {
              // Automatically inject the instituteId when creating
              if (operation === 'create') {
                anyArgs.data = {
                  ...anyArgs.data,
                  instituteId: tenantId
                };
              } else if (operation === 'createMany') {
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data = anyArgs.data.map((d: any) => ({ ...d, instituteId: tenantId }));
                } else {
                  anyArgs.data = { ...anyArgs.data, instituteId: tenantId };
                }
              }
            }
          }
          
          return query(args);
        }
      }
    }
  });
}
