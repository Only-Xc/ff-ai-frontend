import { chromium } from 'playwright'

const CHROME = '/Users/menmapro/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const BASE = 'http://localhost:8081'
const API = 'http://localhost:11499'

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const ctx = await browser.newContext({ baseURL: BASE })
const page = await ctx.newPage()

const apiCalls = []
page.on('request', (req) => {
  const u = req.url()
  if (u.includes('/api/v1/')) {
    apiCalls.push(`${req.method()} ${u.replace(API, '').replace(BASE, '')}`)
  }
})

// 1) Login
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)
await page.locator('input[type="text"], input#account').first().fill('admin@example.com')
await page.locator('input[type="password"]').first().fill('changethis')
const [loginResp] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/v1/login/access-token')),
  page.getByRole('button', { name: 'Login' }).first().click(),
])
const loginBody = await loginResp.json()
const token = loginBody.access_token
console.log(`login status: ${loginResp.status()}`)
await page.waitForURL((u) => !u.pathname.startsWith(`${BASE}/login`), { timeout: 15000 })

// 2) Get tenants via the browser's HTTP context
const headers = { Authorization: `Bearer ${token}` }
const tenantsResp = await ctx.request.get(`${API}/api/v1/admin/users/assignable-tenants`, { headers })
const tenants = await tenantsResp.json()
const tenant = tenants[0]
console.log(`picked tenant: ${JSON.stringify(tenant)}`)

// 3) Navigate to /rbac/users
await page.goto(`${BASE}/rbac/users`, { waitUntil: 'domcontentloaded' })
await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 20000 })

// 4) Click "New User"
await page.getByRole('button', { name: /New User|新建用户/ }).click()
await page
  .locator('.ant-drawer')
  .filter({ has: page.getByLabel(/Email|邮箱/) })
  .waitFor({ state: 'visible', timeout: 10000 })
console.log('drawer opened')
await page.screenshot({ path: '/tmp/e2e-drawer.png', fullPage: true })
const labels = await page.locator('.ant-drawer label').allInnerTexts()
console.log('drawer labels:', JSON.stringify(labels))

// 5) Fill the form
await page.getByLabel('Email').fill('e2e-user@example.com')
await page.getByLabel('Full Name').fill('E2E User')
await page.getByLabel('Password').fill('e2e-password-12345')
await page.getByLabel('Tenant').click()
await page.locator('.ant-select-item-option').filter({ hasText: tenant.name }).first().click()
console.log(`tenant selected: ${tenant.name}`)

// 6) Capture the POST request
const [postReq] = await Promise.all([
  page.waitForRequest((req) => req.method() === 'POST' && req.url().endsWith('/api/v1/users/')),
  page.getByRole('button', { name: /Create|创建/ }).click(),
])
const body = JSON.parse(postReq.postData() || '{}')
console.log(`POST /users/ body: ${JSON.stringify(body, null, 2)}`)

// 7) Verify the user was created in the real backend
const verifyResp = await ctx.request.get(
  `${API}/api/v1/users/?keyword=e2e-user@example.com`,
  { headers },
)
const verifyBody = await verifyResp.json()
console.log(`verify status: ${verifyResp.status()} count: ${verifyBody.count}`)
console.log(`verify data: ${JSON.stringify(verifyBody.data, null, 2)}`)

// 8) Wait and screenshot
await page.waitForTimeout(2000)
await page.screenshot({ path: '/tmp/e2e-after.png', fullPage: true })

// 9) Print all API calls
console.log(`\nall API calls (${apiCalls.length}):`)
for (const c of apiCalls) console.log(' ', c)

await browser.close()
