# Nuxt 4 + Tailwind + Nuxt UI 组件开发指南

> 📅 创建时间：2026-03-03
> 👤 作者：CQ

---

## 一、项目结构规范

### 1.1 推荐目录结构

```
my-nuxt-app/
├── components/
│   ├── ui/                    # Nuxt UI 基础组件封装
│   │   ├── Button.vue
│   │   ├── Card.vue
│   │   └── Modal.vue
│   ├── common/                # 通用业务组件
│   │   ├── Header.vue
│   │   └── Footer.vue
│   └── features/              # 功能模块组件
│       ├── user/
│       │   ├── UserCard.vue
│       │   └── UserForm.vue
│       └── product/
│           ├── ProductList.vue
│           └── ProductCard.vue
├── composables/               # Hooks (Composables)
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useLocalStorage.ts
├── utils/                     # 工具函数
│   ├── format.ts
│   └── validate.ts
├── types/                     # TypeScript 类型定义
│   ├── api.d.ts
│   └── components.d.ts
├── assets/
│   └── css/
│       └── main.css           # 全局样式
├── plugins/                   # 插件
│   └── init.client.ts
└── app.vue
```

---

## 二、组件开发规范

### 2.1 基础组件结构

```vue
<!-- components/ui/CustomButton.vue -->
<script setup lang="ts">
// 1. 类型定义
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
}

// 2. Props 定义（使用 withDefaults）
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})

// 3. Emits 定义
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 4. 内部逻辑
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}

// 5. 计算属性
const variantClasses = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
</script>

<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      variantClasses[variant],
      sizeClasses[size],
      { 'opacity-50 cursor-not-allowed': disabled || loading },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- Loading 状态 -->
    <UIcon
      v-if="loading"
      name="i-heroicons-arrow-path"
      class="animate-spin mr-2"
    />
    
    <!-- Icon -->
    <UIcon
      v-else-if="icon"
      :name="icon"
      class="mr-2"
    />
    
    <!-- Slot 内容 -->
    <slot />
  </button>
</template>
```

### 2.2 使用 Nuxt UI 组件

```vue
<!-- components/features/user/UserCard.vue -->
<script setup lang="ts">
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

defineProps<{
  user: User
  selectable?: boolean
}>()

const emit = defineEmits<{
  select: [userId: string]
  edit: [user: User]
}>()

// 使用 Nuxt UI 的 toast
const toast = useToast()

const handleSelect = () => {
  emit('select', props.user.id)
  toast.add({
    title: '已选择用户',
    description: props.user.name,
  })
}
</script>

<template>
  <UCard
    :class="[
      'transition-shadow hover:shadow-md',
      { 'cursor-pointer': selectable },
    ]"
    @click="handleSelect"
  >
    <template #header>
      <div class="flex items-center gap-4">
        <UAvatar
          :src="user.avatar"
          :alt="user.name"
          size="lg"
        />
        <div>
          <h3 class="font-semibold text-lg">
            {{ user.name }}
          </h3>
          <p class="text-gray-500 text-sm">
            {{ user.email }}
          </p>
        </div>
      </div>
    </template>
    
    <div class="flex gap-2">
      <UButton
        color="primary"
        variant="outline"
        size="sm"
        icon="i-heroicons-pencil"
        @click.stop="emit('edit', user)"
      >
        编辑
      </UButton>
      
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        icon="i-heroicons-trash"
      >
        删除
      </UButton>
    </div>
  </UCard>
</template>
```

---

## 三、Composables (Hooks) 开发

### 3.1 基础 Composable

```typescript
// composables/useAuth.ts
import type { User } from '~/types/api'

interface UseAuthReturn {
  user: Ref<User | null>
  isAuthenticated: ComputedRef<boolean>
  isLoading: Ref<boolean>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const user = useState<User | null>('auth-user', () => null)
  const isLoading = ref(false)
  
  const isAuthenticated = computed(() => !!user.value)
  
  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const { data } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = data.value?.user ?? null
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    await useFetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }
  
  const refreshUser = async () => {
    const { data } = await useFetch('/api/auth/me')
    user.value = data.value?.user ?? null
  }
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  }
}
```

### 3.2 带缓存的 Composable

```typescript
// composables/useLocalStorage.ts
import type { Ref } from 'vue'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): Ref<T> {
  const getValue = (): T => {
    if (import.meta.client) {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
    return defaultValue
  }
  
  const state = useState<T>(`storage-${key}`, getValue)
  
  watch(
    state,
    (newValue) => {
      if (import.meta.client) {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    },
    { deep: true }
  )
  
  return state
}

// 使用示例
const theme = useLocalStorage<'light' | 'dark'>('theme', 'light')
```

### 3.3 API 请求 Composable

```typescript
// composables/useApi.ts
interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  params?: Record<string, string>
}

interface UseApiReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: (options?: ApiOptions) => Promise<void>
}

export function useApi<T>(
  endpoint: string,
  initialOptions?: ApiOptions
): UseApiReturn<T> {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  const execute = async (options?: ApiOptions) => {
    loading.value = true
    error.value = null
    
    try {
      const { data: result } = await useFetch<T>(endpoint, {
        method: options?.method || initialOptions?.method || 'GET',
        body: options?.body || initialOptions?.body,
        query: options?.params || initialOptions?.params,
      })
      
      data.value = result.value
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  // 自动执行初始请求
  if (initialOptions) {
    execute(initialOptions)
  }
  
  return {
    data,
    loading,
    error,
    execute,
  }
}

// 使用示例
const { data: users, loading, error } = useApi<User[]>('/api/users')
```

---

## 四、样式规范

### 4.1 Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // 自定义主题色
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### 4.2 全局样式

```css
/* assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply antialiased;
  }
  
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  /* 通用按钮样式 */
  .btn-primary {
    @apply px-4 py-2 bg-primary-500 text-white rounded-lg 
           hover:bg-primary-600 transition-colors
           focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
  
  /* 卡片样式 */
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-100 
           p-6 hover:shadow-md transition-shadow;
  }
}

@layer utilities {
  /* 文本截断 */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

### 4.3 组件样式最佳实践

```vue
<script setup lang="ts">
// 使用 class 绑定，保持模板清晰
const props = defineProps<{
  variant?: 'default' | 'minimal'
  size?: 'compact' | 'spacious'
}>()

const containerClass = computed(() => [
  'rounded-lg transition-all duration-200',
  props.variant === 'minimal' 
    ? 'bg-transparent border border-gray-200' 
    : 'bg-white shadow-sm',
  props.size === 'compact' ? 'p-3' : 'p-6',
])
</script>

<template>
  <div :class="containerClass">
    <slot />
  </div>
</template>
```

---

## 五、TypeScript 类型定义

### 5.1 组件 Props 类型

```typescript
// types/components.d.ts
import type { ButtonVariant, ButtonSize } from '#ui/types'

export interface BaseButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: string
  trailingIcon?: string
}

export interface CardProps {
  title?: string
  description?: string
  footer?: boolean
  class?: string | string[]
}
```

### 5.2 API 响应类型

```typescript
// types/api.d.ts
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

## 六、Nuxt 4 新特性

### 6.1 使用新的目录结构

```
# Nuxt 4 推荐结构
├── app/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   └── pages/
├── server/
│   └── api/
└── nuxt.config.ts
```

### 6.2 新的 Composables

```typescript
// 使用 useFetch 的增强功能
const { data, status, error, refresh } = await useFetch('/api/users', {
  lazy: true,           // 组件异步加载
  server: true,         // 服务端预渲染
  default: () => [],    // 默认值
  transform: (data) => data.users, // 数据转换
})

// 使用 useAsyncData 处理复杂逻辑
const users = await useAsyncData('users', async () => {
  const [users, posts] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
  ])
  return { users, posts }
})
```

### 6.3 服务端 API

```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  
  // 访问数据库
  const users = await db.select('*').from('users')
  
  return {
    data: users,
    total: users.length,
  }
})

// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 验证
  const { error } = validate(body, {
    email: z.string().email(),
    name: z.string().min(2),
  })
  
  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }
  
  // 创建用户
  const user = await db.insert('users').values(body)
  
  return { data: user }
})
```

---

## 七、完整示例：用户管理模块

### 7.1 Composable

```typescript
// composables/useUsers.ts
import type { User, PaginatedResponse } from '~/types/api'

interface UseUsersOptions {
  page?: number
  pageSize?: number
}

export function useUsers(options: UseUsersOptions = {}) {
  const { page = 1, pageSize = 10 } = options
  
  const { data, loading, error, refresh } = useFetch<PaginatedResponse<User>>(
    '/api/users',
    {
      query: { page, pageSize },
    }
  )
  
  const users = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)
  
  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    await $fetch('/api/users', {
      method: 'POST',
      body: userData,
    })
    await refresh()
  }
  
  const deleteUser = async (id: string) => {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
    await refresh()
  }
  
  return {
    users,
    total,
    loading,
    error,
    refresh,
    createUser,
    deleteUser,
  }
}
```

### 7.2 组件

```vue
<!-- components/features/user/UserList.vue -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  pageSize?: number
}>(), {
  pageSize: 10,
})

const page = ref(1)
const { users, total, loading, error, refresh, deleteUser } = useUsers({
  page,
  pageSize: props.pageSize,
})

const toast = useToast()
const modalOpen = ref(false)
const editingUser = ref<User | null>(null)

const handleDelete = async (user: User) => {
  try {
    await deleteUser(user.id)
    toast.add({
      title: '删除成功',
      color: 'green',
    })
  } catch {
    toast.add({
      title: '删除失败',
      color: 'red',
    })
  }
}

const handleEdit = (user: User) => {
  editingUser.value = user
  modalOpen.value = true
}
</script>

<template>
  <div>
    <!-- 头部操作栏 -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold">
        用户列表 ({{ total }})
      </h2>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        @click="modalOpen = true"
      >
        添加用户
      </UButton>
    </div>
    
    <!-- 加载状态 -->
    <USkeleton
      v-if="loading"
      class="h-32 w-full"
    />
    
    <!-- 错误状态 -->
    <UAlert
      v-else-if="error"
      color="red"
      title="加载失败"
      :description="error.message"
    />
    
    <!-- 用户列表 -->
    <div
      v-else
      class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <UserCard
        v-for="user in users"
        :key="user.id"
        :user="user"
        selectable
        @select="(id) => $router.push(`/users/${id}`)"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
    
    <!-- 分页 -->
    <UPagination
      v-model="page"
      :total="total"
      :page-size="pageSize"
      class="mt-6 justify-center"
    />
    
    <!-- 编辑模态框 -->
    <UModal v-model="modalOpen">
      <UserForm
        :user="editingUser"
        @saved="
          modalOpen = false
          refresh()
        "
      />
    </UModal>
  </div>
</template>
```

---

## 八、开发工具与插件

### 8.1 推荐 VS Code 插件

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "Vue.volar",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### 8.2 ESLint + Prettier 配置

```typescript
// eslint.config.js
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
})
```

```javascript
// prettier.config.js
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
}
```

---

## 九、测试规范

### 9.1 组件测试

```typescript
// tests/components/Button.test.ts
import { mount } from '@vue/test-utils'
import CustomButton from '~/components/ui/CustomButton.vue'

describe('CustomButton', () => {
  it('renders default slot content', () => {
    const wrapper = mount(CustomButton, {
      slots: { default: 'Click me' },
    })
    expect(wrapper.text()).toContain('Click me')
  })
  
  it('emits click event', async () => {
    const wrapper = mount(CustomButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('disables when loading', async () => {
    const wrapper = mount(CustomButton, {
      props: { loading: true },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
```

### 9.2 Composable 测试

```typescript
// tests/composables/useAuth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '~/composables/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('returns unauthenticated state initially', () => {
    const { isAuthenticated } = useAuth()
    expect(isAuthenticated.value).toBe(false)
  })
})
```

---

## 📚 参考链接

- [Nuxt 4 文档](https://nuxt.com/docs)
- [Nuxt UI 文档](https://ui.nuxt.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vue 3 文档](https://vuejs.org/)

---

**最后更新：** 2026-03-03
