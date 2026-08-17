/**
 * Tenant Isolation Tests — Module 29
 * 
 * Verifies that the Prisma Client Extension successfully isolates
 * data queries by `instituteId`, preventing cross-tenant leakage.
 */

import { getTenantPrisma } from '../utils/tenant.context';
import { prisma as basePrisma } from '../utils/prisma';

// Mock test suite - would normally use Jest/Mocha
export async function runTenantIsolationTests() {
  console.log('--- Starting Tenant Isolation Tests ---');

  // 1. Setup Mock Tenants & Data
  const tenantA = await basePrisma.institute.create({
    data: { name: 'Institute A', code: 'INST_A' }
  });
  
  const tenantB = await basePrisma.institute.create({
    data: { name: 'Institute B', code: 'INST_B' }
  });

  const deptA = await basePrisma.department.create({
    data: { name: 'Dept A', code: 'DEPT_A', instituteId: tenantA.id }
  });

  const deptB = await basePrisma.department.create({
    data: { name: 'Dept B', code: 'DEPT_B', instituteId: tenantB.id }
  });

  // 2. Initialize Scoped Clients
  const prismaA = getTenantPrisma(tenantA.id);
  const prismaB = getTenantPrisma(tenantB.id);

  // 3. Test Read Isolation
  const deptsFromA = await prismaA.department.findMany();
  const deptsFromB = await prismaB.department.findMany();

  if (deptsFromA.some(d => d.instituteId !== tenantA.id)) {
    throw new Error('Tenant A read leaked data from another tenant!');
  }
  
  if (deptsFromB.some(d => d.instituteId !== tenantB.id)) {
    throw new Error('Tenant B read leaked data from another tenant!');
  }

  // 4. Test Write Isolation
  // Tenant A attempts to update Dept B (should fail or affect 0 rows)
  const updateAttempt = await prismaA.department.updateMany({
    where: { id: deptB.id },
    data: { name: 'Hacked by A' }
  });

  if (updateAttempt.count > 0) {
    throw new Error('Tenant A successfully updated Tenant B data!');
  }

  // 5. Test Implicit Create Assignment
  const newDeptA = await prismaA.department.create({
    // @ts-ignore - intentionally omitting instituteId to test auto-injection
    data: { name: 'Auto Dept A', code: 'AUTO_A' }
  });

  if (newDeptA.instituteId !== tenantA.id) {
    throw new Error('Tenant A auto-injection failed!');
  }

  // Cleanup
  await basePrisma.department.deleteMany({ where: { id: { in: [deptA.id, deptB.id, newDeptA.id] } } });
  await basePrisma.institute.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });

  console.log('✅ Tenant Isolation Tests Passed: Zero Data Leakage Detected.');
}
