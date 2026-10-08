// test_lifecycle_e2e.mjs
// Verifies Phase 31.6: My Creations and Graveyard API, Isolation, Soft Delete, Restore, Permanent Delete

const API_BASE = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

async function run() {
  console.log('--- Starting Phase 31.6 End-to-End Verification ---');

  // 1. Create Project Alpha
  console.log('1. Creating Project Alpha...');
  const resA = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Project Alpha Forest', seed_text: 'Deep in the verdant woods.' }),
  });
  if (!resA.success) throw new Error('Failed to create Project Alpha');
  const projA = resA.data;
  console.log(`   Created Project Alpha: ID=${projA.id}`);

  // 2. Create Project Beta
  console.log('2. Creating Project Beta...');
  const resB = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Project Beta Ocean', seed_text: 'Beneath the sapphire waves.' }),
  });
  if (!resB.success) throw new Error('Failed to create Project Beta');
  const projB = resB.data;
  console.log(`   Created Project Beta: ID=${projB.id}`);

  // 3. Verify Active Creations List (both Alpha and Beta present)
  console.log('3. Verifying active creations list...');
  const listActive1 = await request('/projects');
  const activeIds1 = listActive1.data.map(p => p.id);
  if (!activeIds1.includes(projA.id) || !activeIds1.includes(projB.id)) {
    throw new Error('Both projects must appear in active creations');
  }
  console.log('   PASS: Both Project Alpha and Beta appear in My Creations.');

  // 4. Verify Graveyard is initially free of Alpha and Beta
  console.log('4. Verifying Graveyard does not contain active projects...');
  const listGrave1 = await request('/projects/graveyard');
  const graveIds1 = listGrave1.data.map(p => p.id);
  if (graveIds1.includes(projA.id) || graveIds1.includes(projB.id)) {
    throw new Error('Active projects must not appear in Graveyard');
  }
  console.log('   PASS: Graveyard does not contain Project Alpha or Beta.');

  // 5. Soft-delete Project Alpha (Move to Graveyard)
  console.log('5. Soft-deleting Project Alpha (Move to Graveyard)...');
  const delRes = await request(`/projects/${projA.id}`, { method: 'DELETE' });
  if (!delRes.success || !delRes.data.deleted_at) {
    throw new Error('Failed to soft delete Project Alpha');
  }
  console.log(`   PASS: Project Alpha soft deleted at ${delRes.data.deleted_at}.`);

  // 6. Verify Isolation: Project Alpha gone from active, Project Beta remains
  console.log('6. Verifying project isolation in active creations...');
  const listActive2 = await request('/projects');
  const activeIds2 = listActive2.data.map(p => p.id);
  if (activeIds2.includes(projA.id)) throw new Error('Project Alpha must not appear in My Creations');
  if (!activeIds2.includes(projB.id)) throw new Error('Project Beta must remain in My Creations');
  console.log('   PASS: Project Alpha removed from My Creations, Project Beta remains intact.');

  // 7. Verify Project Alpha appears in Graveyard
  console.log('7. Verifying Project Alpha in Graveyard...');
  const listGrave2 = await request('/projects/graveyard');
  const graveIds2 = listGrave2.data.map(p => p.id);
  if (!graveIds2.includes(projA.id)) throw new Error('Project Alpha must appear in Graveyard');
  if (graveIds2.includes(projB.id)) throw new Error('Project Beta must not appear in Graveyard');
  console.log('   PASS: Project Alpha is present in Graveyard.');

  // 8. Restore Project Alpha from Graveyard
  console.log('8. Restoring Project Alpha...');
  const restoreRes = await request(`/projects/${projA.id}/restore`, { method: 'POST' });
  if (!restoreRes.success || restoreRes.data.deleted_at !== null) {
    throw new Error('Failed to restore Project Alpha');
  }
  console.log('   PASS: Project Alpha successfully restored (deleted_at is null).');

  // 9. Verify Project Alpha returns to My Creations and leaves Graveyard
  console.log('9. Verifying Project Alpha back in My Creations...');
  const listActive3 = await request('/projects');
  const activeIds3 = listActive3.data.map(p => p.id);
  if (!activeIds3.includes(projA.id) || !activeIds3.includes(projB.id)) {
    throw new Error('Both Project Alpha and Beta must be in My Creations after restore');
  }
  const listGrave3 = await request('/projects/graveyard');
  const graveIds3 = listGrave3.data.map(p => p.id);
  if (graveIds3.includes(projA.id)) throw new Error('Project Alpha must be gone from Graveyard');
  console.log('   PASS: Project Alpha restored to My Creations and removed from Graveyard.');

  // 10. Verify Project Bundle & Route accessibility after restore (Phase 31.5 integrity)
  console.log('10. Verifying Project Alpha bundle retrieval (/projects/:id/bundle)...');
  const bundleRes = await request(`/projects/${projA.id}/bundle`);
  if (!bundleRes.success || !bundleRes.data.project) {
    throw new Error('Bundle loading must succeed for restored project');
  }
  if (bundleRes.data.project.id !== projA.id) {
    throw new Error('Project bundle ID mismatch');
  }
  console.log('   PASS: Restored project bundle loaded authoritatively.');

  // 11. Test Permanent Deletion
  console.log('11. Testing Permanent Deletion on temporary project...');
  const tempRes = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Temporary Test', seed_text: 'To be wiped' }),
  });
  const tempId = tempRes.data.id;
  const permRes = await request(`/projects/${tempId}/permanent`, { method: 'DELETE' });
  if (!permRes.success || !permRes.data.deleted) {
    throw new Error('Permanent deletion failed');
  }
  const checkNotFound = await request(`/projects/${tempId}`);
  if (checkNotFound.success) {
    throw new Error('Project must be completely deleted and return 404');
  }
  console.log('   PASS: Permanent delete safely removes project and cascades.');

  console.log('\n==================================================');
  console.log('ALL PHASE 31.6 END-TO-END VERIFICATIONS PASSED (11/11)');
  console.log('==================================================\n');
}

run().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
