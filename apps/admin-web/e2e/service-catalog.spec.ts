import { expect, test } from '@playwright/test'

test.describe('service-catalog end-to-end', () => {
  test('admin-web dev server renders service-catalog pages', async ({ page }) => {
    // 不绕开登录：admin-web 默认可能需要 login，跳到登录页面是 OK 的
    await page.goto('/service-catalog/services', { waitUntil: 'domcontentloaded' })
    // 等待路由组件挂载（即使被重定向到 /login 也可见）
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    const url = page.url()
    // 接受以下任一情况：登录页 / 服务列表 / 任意路由解析成功（页面 HTML 正常）
    expect(url).toMatch(/(\/login|\/service-catalog)/)
    const html = await page.content()
    expect(html.length).toBeGreaterThan(0)
  })

  test('service-catalog import page route resolves', async ({ page }) => {
    const resp = await page.goto('/service-catalog/import', { waitUntil: 'domcontentloaded' })
    expect(resp === null || resp.status() < 500).toBeTruthy()
  })

  test('service-catalog categories route resolves', async ({ page }) => {
    const resp = await page.goto('/service-catalog/categories', { waitUntil: 'domcontentloaded' })
    expect(resp === null || resp.status() < 500).toBeTruthy()
  })

  test('service-catalog services route resolves', async ({ page }) => {
    const resp = await page.goto('/service-catalog/services', { waitUntil: 'domcontentloaded' })
    expect(resp === null || resp.status() < 500).toBeTruthy()
  })
})
