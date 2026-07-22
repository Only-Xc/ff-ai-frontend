# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-tenant.spec.ts >> user-tenant binding (route-mock) >> user list page renders with tenant column for each row
- Location: e2e/user-tenant.spec.ts:108:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  11  | 
  12  | const ROLES = [
  13  |   { id: 'role-viewer', code: 'viewer', name: 'Viewer', scope_type: 'organization', organization_id: null, is_system: true, is_active: true, permission_count: 0, user_count: 0, created_at: NOW, updated_at: NOW },
  14  |   { id: 'role-tenant-admin', code: 'tenant_admin', name: 'Tenant Admin', scope_type: 'organization', organization_id: null, is_system: true, is_active: true, permission_count: 0, user_count: 0, created_at: NOW, updated_at: NOW },
  15  | ]
  16  | 
  17  | const USERS = [
  18  |   { id: 'user-1', email: 'super@admin.com', full_name: 'Platform Admin', is_active: true, is_superuser: true, created_at: NOW, primary_organization: { id: 'tenant-a', name: 'Acme Corp', code: 'acme-corp' } },
  19  |   { id: 'user-2', email: 'alice@acme.com', full_name: 'Alice', is_active: true, is_superuser: false, created_at: NOW, primary_organization: { id: 'tenant-a', name: 'Acme Corp', code: 'acme-corp' } },
  20  | ]
  21  | 
  22  | async function setupMocks(page: Page, opts: { isPlatformAdmin: boolean }) {
  23  |   const me = opts.isPlatformAdmin ? USERS[0] : USERS[1]
  24  |   await page.route('**/api/v1/login/access-token', async (route) => {
  25  |     await route.fulfill({
  26  |       status: 200, contentType: 'application/json',
  27  |       body: JSON.stringify({ access_token: TOKEN, token_type: 'bearer' }),
  28  |     })
  29  |   })
  30  |   await page.route('**/api/v1/login/test-token', async (route) => {
  31  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) })
  32  |   })
  33  |   await page.route('**/api/v1/users/me', async (route) => {
  34  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) })
  35  |   })
  36  |   await page.route('**/api/v1/rbac/me', async (route) => {
  37  |     await route.fulfill({
  38  |       status: 200, contentType: 'application/json',
  39  |       body: JSON.stringify({
  40  |         user_id: me.id, is_superuser: me.is_superuser,
  41  |         role_codes: opts.isPlatformAdmin ? ['system_admin', 'viewer'] : ['tenant_admin', 'viewer'],
  42  |         permission_codes: opts.isPlatformAdmin
  43  |           ? ['admin.users.create', 'admin.users.update', 'admin.users.delete', 'admin.users.read']
  44  |           : ['admin.users.read', 'admin.users.update'],
  45  |         menu_codes: ['menu.admin.rbac'],
  46  |         organizations: [{ id: 'tenant-a', name: 'Acme Corp', type: 'tenant', is_primary: true }],
  47  |       }),
  48  |     })
  49  |   })
  50  |   await page.route('**/api/v1/menus/me**', async (route) =>
  51  |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  52  |   )
  53  |   await page.route('**/api/v1/admin/users/assignable-tenants**', async (route) => {
  54  |     const body = opts.isPlatformAdmin ? TENANTS : [TENANTS[0]]
  55  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  56  |   })
  57  |   await page.route('**/api/v1/admin/roles**', async (route) =>
  58  |     route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ROLES, count: ROLES.length }) }),
  59  |   )
  60  |   await page.route('**/api/v1/admin/users/*/roles', async (route) =>
  61  |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  62  |   )
  63  |   await page.route(/\/api\/v1\/users\/?(\?.*)?$/, async (route) =>
  64  |     route.fulfill({
  65  |       status: 200, contentType: 'application/json',
  66  |       body: JSON.stringify({ data: USERS, count: USERS.length }),
  67  |     }),
  68  |   )
  69  |   await page.route('**/api/v1/users/**', async (route) => {
  70  |     const req = route.request()
  71  |     if (req.method() === 'POST' || req.method() === 'PATCH') {
  72  |       const payload = JSON.parse(req.postData() || '{}')
  73  |       if (!payload.organization_id) {
  74  |         await route.fulfill({
  75  |           status: 422, contentType: 'application/json',
  76  |           body: JSON.stringify({ detail: 'organization_id is required' }),
  77  |         })
  78  |         return
  79  |       }
  80  |       const org = TENANTS.find((t) => t.id === payload.organization_id)
  81  |       await route.fulfill({
  82  |         status: 200, contentType: 'application/json',
  83  |         body: JSON.stringify({
  84  |           id: 'user-new',
  85  |           email: payload.email,
  86  |           full_name: payload.full_name,
  87  |           is_active: payload.is_active ?? true,
  88  |           is_superuser: payload.is_superuser ?? false,
  89  |           created_at: NOW,
  90  |           primary_organization: org ? { id: org.id, name: org.name, code: org.code } : null,
  91  |         }),
  92  |       })
  93  |       return
  94  |     }
  95  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) })
  96  |   })
  97  | }
  98  | 
  99  | async function loginViaStorage(page: Page) {
  100 |   await page.addInitScript((t) => {
  101 |     localStorage.setItem('ff-admin-access-token', t)
  102 |   }, TOKEN)
  103 | }
  104 | 
  105 | test.describe('user-tenant binding (route-mock)', () => {
  106 |   test.setTimeout(60_000)
  107 | 
  108 |   test('user list page renders with tenant column for each row', async ({ page }) => {
  109 |     await setupMocks(page, { isPlatformAdmin: true })
  110 |     await loginViaStorage(page)
> 111 |     await page.goto('/rbac/users')
      |                ^ Error: page.goto: Target page, context or browser has been closed
  112 |     await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
  113 |     await expect(page.locator('table tbody tr').filter({ hasText: 'Acme Corp' })).toHaveCount(2)
  114 |   })
  115 | 
  116 |   test('create submit payload includes organization_id', async ({ page }) => {
  117 |     await setupMocks(page, { isPlatformAdmin: true })
  118 |     await loginViaStorage(page)
  119 |     await page.goto('/rbac/users')
  120 |     await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
  121 | 
  122 |     const postPromise = page.waitForRequest(
  123 |       (req) => req.method() === 'POST' && /\/api\/v1\/users\/?$/.test(req.url()),
  124 |     )
  125 | 
  126 |     await page.getByRole('button', { name: /新建用户|New User/ }).click()
  127 |     await expect(page.getByLabel(/邮箱|Email/)).toBeVisible()
  128 | 
  129 |     await page.getByLabel(/邮箱|Email/).fill('newuser@acme.com')
  130 |     await page.getByLabel(/姓名|Full Name/).fill('New User')
  131 |     await page.getByLabel(/密码|Password/).fill('password12345')
  132 | 
  133 |     await page.locator('.ant-select').nth(1).click()
  134 |     await page.locator('.ant-select-item-option').filter({ hasText: 'Acme Corp' }).first().click()
  135 | 
  136 |     await page.getByRole('button', { name: /^创建$|^Create$/ }).click()
  137 | 
  138 |     const req = await postPromise
  139 |     const body = JSON.parse(req.postData() || '{}')
  140 |     expect(body.organization_id).toBeTruthy()
  141 |     expect(body.email).toBe('newuser@acme.com')
  142 |     expect(body.full_name).toBe('New User')
  143 |   })
  144 | 
  145 |   test('server rejects create without organization_id with 422', async ({ page }) => {
  146 |     await setupMocks(page, { isPlatformAdmin: true })
  147 |     await loginViaStorage(page)
  148 |     await page.goto('/rbac/users')
  149 |     await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
  150 | 
  151 |     const responsePromise = page.waitForResponse(
  152 |       (resp) => resp.request().method() === 'POST' && /\/api\/v1\/users\/?$/.test(resp.url()),
  153 |     )
  154 | 
  155 |     await page.route('**/api/v1/users/', async (route) => {
  156 |       if (route.request().method() === 'POST') {
  157 |         const payload = JSON.parse(route.request().postData() || '{}')
  158 |         expect(payload.organization_id).toBeFalsy()
  159 |         await route.fulfill({
  160 |           status: 422, contentType: 'application/json',
  161 |           body: JSON.stringify({ detail: 'organization_id is required' }),
  162 |         })
  163 |       }
  164 |     })
  165 | 
  166 |     await page.getByRole('button', { name: /新建用户|New User/ }).click()
  167 |     await page.getByLabel(/邮箱|Email/).fill('notenant@acme.com')
  168 |     await page.getByLabel(/姓名|Full Name/).fill('No Tenant')
  169 |     await page.getByLabel(/密码|Password/).fill('password12345')
  170 |     await page.getByRole('button', { name: /^创建$|^Create$/ }).click()
  171 | 
  172 |     const resp = await responsePromise
  173 |     expect(resp.status()).toBe(422)
  174 |   })
  175 | 
  176 |   test('tenant admin sees a locked tenant select on edit', async ({ page }) => {
  177 |     // Login as a non-superuser with limited permissions.
  178 |     await setupMocks(page, { isPlatformAdmin: false })
  179 |     await loginViaStorage(page)
  180 |     await page.goto('/rbac/users')
  181 |     await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
  182 |     await page.waitForTimeout(500)
  183 | 
  184 |     // The first row's Edit button should be present (mock grants admin.users.update).
  185 |     const editBtn = page.locator('table tbody tr').first().getByRole('button', { name: /Edit/ })
  186 |     await expect(editBtn).toBeVisible({ timeout: 5000 })
  187 |     await editBtn.click()
  188 | 
  189 |     // The tenant select renders disabled because tenant admins cannot change tenants.
  190 |     await expect(page.locator('.ant-select-disabled').first()).toBeVisible({ timeout: 10000 })
  191 |     // The hint copy explains the lock.
  192 |     await expect(page.getByText(/Tenant administrators can only edit|租户管理员只能编辑/)).toBeVisible()
  193 |   })
  194 | })
  195 | 
```