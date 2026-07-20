import { expect, test, type Page } from '@playwright/test'

const TOKEN = 'mock-platform-admin-token'
const NOW = '2026-07-20T10:00:00Z'

const TENANTS = [
  { id: 'tenant-a', name: 'Acme Corp', code: 'acme-corp', type: 'tenant' },
  { id: 'tenant-b', name: 'Globex', code: 'globex', type: 'tenant' },
  { id: 'tenant-c', name: 'Initech', code: 'initech', type: 'tenant' },
]

const ROLES = [
  { id: 'role-viewer', code: 'viewer', name: 'Viewer', scope_type: 'organization', organization_id: null, is_system: true, is_active: true, permission_count: 0, user_count: 0, created_at: NOW, updated_at: NOW },
  { id: 'role-tenant-admin', code: 'tenant_admin', name: 'Tenant Admin', scope_type: 'organization', organization_id: null, is_system: true, is_active: true, permission_count: 0, user_count: 0, created_at: NOW, updated_at: NOW },
]

const USERS = [
  { id: 'user-1', email: 'super@admin.com', full_name: 'Platform Admin', is_active: true, is_superuser: true, created_at: NOW, primary_organization: { id: 'tenant-a', name: 'Acme Corp', code: 'acme-corp' } },
  { id: 'user-2', email: 'alice@acme.com', full_name: 'Alice', is_active: true, is_superuser: false, created_at: NOW, primary_organization: { id: 'tenant-a', name: 'Acme Corp', code: 'acme-corp' } },
]

async function setupMocks(page: Page, opts: { isPlatformAdmin: boolean }) {
  const me = opts.isPlatformAdmin ? USERS[0] : USERS[1]
  await page.route('**/api/v1/login/access-token', async (route) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ access_token: TOKEN, token_type: 'bearer' }),
    })
  })
  await page.route('**/api/v1/login/test-token', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) })
  })
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) })
  })
  await page.route('**/api/v1/rbac/me', async (route) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        user_id: me.id, is_superuser: me.is_superuser,
        role_codes: opts.isPlatformAdmin ? ['system_admin', 'viewer'] : ['tenant_admin', 'viewer'],
        permission_codes: opts.isPlatformAdmin
          ? ['admin.users.create', 'admin.users.update', 'admin.users.delete', 'admin.users.read']
          : ['admin.users.read', 'admin.users.update'],
        menu_codes: ['menu.admin.rbac'],
        organizations: [{ id: 'tenant-a', name: 'Acme Corp', type: 'tenant', is_primary: true }],
      }),
    })
  })
  await page.route('**/api/v1/menus/me**', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/api/v1/admin/users/assignable-tenants**', async (route) => {
    const body = opts.isPlatformAdmin ? TENANTS : [TENANTS[0]]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.route('**/api/v1/admin/roles**', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ROLES, count: ROLES.length }) }),
  )
  await page.route('**/api/v1/admin/users/*/roles', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route(/\/api\/v1\/users\/?(\?.*)?$/, async (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: USERS, count: USERS.length }),
    }),
  )
  await page.route('**/api/v1/users/**', async (route) => {
    const req = route.request()
    if (req.method() === 'POST' || req.method() === 'PATCH') {
      const payload = JSON.parse(req.postData() || '{}')
      if (!payload.organization_id) {
        await route.fulfill({
          status: 422, contentType: 'application/json',
          body: JSON.stringify({ detail: 'organization_id is required' }),
        })
        return
      }
      const org = TENANTS.find((t) => t.id === payload.organization_id)
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-new',
          email: payload.email,
          full_name: payload.full_name,
          is_active: payload.is_active ?? true,
          is_superuser: payload.is_superuser ?? false,
          created_at: NOW,
          primary_organization: org ? { id: org.id, name: org.name, code: org.code } : null,
        }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) })
  })
}

async function loginViaStorage(page: Page) {
  await page.addInitScript((t) => {
    localStorage.setItem('ff-admin-access-token', t)
  }, TOKEN)
}

test.describe('user-tenant binding (route-mock)', () => {
  test.setTimeout(60_000)

  test('user list page renders with tenant column for each row', async ({ page }) => {
    await setupMocks(page, { isPlatformAdmin: true })
    await loginViaStorage(page)
    await page.goto('/rbac/users')
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('table tbody tr').filter({ hasText: 'Acme Corp' })).toHaveCount(2)
  })

  test('create submit payload includes organization_id', async ({ page }) => {
    await setupMocks(page, { isPlatformAdmin: true })
    await loginViaStorage(page)
    await page.goto('/rbac/users')
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })

    const postPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/api\/v1\/users\/?$/.test(req.url()),
    )

    await page.getByRole('button', { name: /新建用户|New User/ }).click()
    await expect(page.getByLabel(/邮箱|Email/)).toBeVisible()

    await page.getByLabel(/邮箱|Email/).fill('newuser@acme.com')
    await page.getByLabel(/姓名|Full Name/).fill('New User')
    await page.getByLabel(/密码|Password/).fill('password12345')

    await page.locator('.ant-select').nth(1).click()
    await page.locator('.ant-select-item-option').filter({ hasText: 'Acme Corp' }).first().click()

    await page.getByRole('button', { name: /^创建$|^Create$/ }).click()

    const req = await postPromise
    const body = JSON.parse(req.postData() || '{}')
    expect(body.organization_id).toBeTruthy()
    expect(body.email).toBe('newuser@acme.com')
    expect(body.full_name).toBe('New User')
  })

  test('server rejects create without organization_id with 422', async ({ page }) => {
    await setupMocks(page, { isPlatformAdmin: true })
    await loginViaStorage(page)
    await page.goto('/rbac/users')
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })

    const responsePromise = page.waitForResponse(
      (resp) => resp.request().method() === 'POST' && /\/api\/v1\/users\/?$/.test(resp.url()),
    )

    await page.route('**/api/v1/users/', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}')
        expect(payload.organization_id).toBeFalsy()
        await route.fulfill({
          status: 422, contentType: 'application/json',
          body: JSON.stringify({ detail: 'organization_id is required' }),
        })
      }
    })

    await page.getByRole('button', { name: /新建用户|New User/ }).click()
    await page.getByLabel(/邮箱|Email/).fill('notenant@acme.com')
    await page.getByLabel(/姓名|Full Name/).fill('No Tenant')
    await page.getByLabel(/密码|Password/).fill('password12345')
    await page.getByRole('button', { name: /^创建$|^Create$/ }).click()

    const resp = await responsePromise
    expect(resp.status()).toBe(422)
  })

  test('tenant admin sees a locked tenant select on edit', async ({ page }) => {
    // Login as a non-superuser with limited permissions.
    await setupMocks(page, { isPlatformAdmin: false })
    await loginViaStorage(page)
    await page.goto('/rbac/users')
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(500)

    // The first row's Edit button should be present (mock grants admin.users.update).
    const editBtn = page.locator('table tbody tr').first().getByRole('button', { name: /Edit/ })
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()

    // The tenant select renders disabled because tenant admins cannot change tenants.
    await expect(page.locator('.ant-select-disabled').first()).toBeVisible({ timeout: 10000 })
    // The hint copy explains the lock.
    await expect(page.getByText(/Tenant administrators can only edit|租户管理员只能编辑/)).toBeVisible()
  })
})
