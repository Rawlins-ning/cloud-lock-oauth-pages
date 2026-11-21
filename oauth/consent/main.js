import { createClient } from '@supabase/supabase-js'

const message = document.getElementById('message')
const login = document.getElementById('login')
const loginForm = document.getElementById('login-form')
const loginButton = document.getElementById('login-button')
const consent = document.getElementById('consent')
const approveButton = document.getElementById('approve')
const denyButton = document.getElementById('deny')
const authorizationId = new URLSearchParams(window.location.search).get('authorization_id')

function showMessage(text, color = '#8a2929') {
  message.textContent = text
  message.style.color = color
}

function showOnly(panel) {
  login.hidden = panel !== 'login'
  consent.hidden = panel !== 'consent'
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Vite embeds publishable configuration in static assets. Never embed secret keys
// or application lock credentials; the backend verifies all permissions.
if (!supabaseUrl?.startsWith('https://') || !publishableKey?.startsWith('sb_publishable_')) {
  showMessage('授权站点尚未配置或部署，无法登录。')
  throw new Error('Missing public Supabase configuration')
}

const supabase = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})

function redirectToIssuedUrl(url) {
  // Supabase Auth validates registered OAuth client redirect URIs.
  // Never accept a redirect destination directly from user query parameters.
  if (typeof url !== 'string' || !url) {
    throw new Error('Invalid OAuth redirect response')
  }
  window.location.assign(url)
}

async function loadAuthorization() {
  if (!authorizationId || authorizationId.length > 256) {
    showOnly(null)
    showMessage('缺少有效授权请求。请从 WorkBuddy 发起连接，不要直接打开此页面。')
    return
  }

  showMessage('正在检查登录状态...', '#46546a')
  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError || !userResult?.user) {
    showOnly('login')
    showMessage('请先登录已有账号。', '#46546a')
    return
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !data) {
    showOnly(null)
    showMessage('无法核对授权请求，请重新从 WorkBuddy 发起连接。')
    return
  }

  // If consent is already valid, Supabase Auth directly returns its registered
  // client redirect URL. This is never parsed from browser-supplied query text.
  if (!('authorization_id' in data)) {
    try {
      redirectToIssuedUrl(data.redirect_url)
    } catch {
      showMessage('授权重定向失败，请重新发起连接。')
    }
    return
  }

  document.getElementById('identity').textContent = '当前账号：' + (userResult.user.email || '已认证用户')
  document.getElementById('client').textContent = data.client?.name || '未提供名称的应用'
  document.getElementById('scopes').textContent =
    (typeof data.scope === 'string' && data.scope.trim()) ? data.scope.split(/\s+/).join('，') : '未声明额外权限'
  document.getElementById('redirect-uri').textContent = data.redirect_uri || '未提供'
  showOnly('consent')
  showMessage('请检查应用和权限，选择允许或拒绝。', '#46546a')
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault()
  loginButton.disabled = true
  showMessage('正在验证登录信息...', '#46546a')
  const form = new FormData(loginForm)
  const email = String(form.get('email') || '')
  const password = String(form.get('password') || '')
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      showMessage('登录失败，请检查账号或密码。')
      return
    }
    loginForm.reset()
    await loadAuthorization()
  } catch {
    showMessage('登录服务暂时不可用。')
  } finally {
    loginButton.disabled = false
  }
})

async function decide(approved) {
  approveButton.disabled = true
  denyButton.disabled = true
  showMessage(approved ? '正在提交授权决定...' : '正在拒绝授权请求...', '#46546a')
  try {
    const result = approved
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId)
    if (result.error || !result.data?.redirect_url) {
      showMessage('授权处理失败，请重新从 WorkBuddy 发起连接。')
      return
    }
    redirectToIssuedUrl(result.data.redirect_url)
  } catch {
    showMessage('无法完成授权处理，请重试。')
  } finally {
    approveButton.disabled = false
    denyButton.disabled = false
  }
}

approveButton.addEventListener('click', () => decide(true))
denyButton.addEventListener('click', () => decide(false))

loadAuthorization().catch(() => {
  showOnly(null)
  showMessage('认证状态检查失败，请稍后再试。')
})
