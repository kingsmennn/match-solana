import { User, AccountType, STORE_KEY_MIDDLEWARE } from '@/types'
export default defineNuxtRouteMiddleware(async (to, from) => {
  const userCookie = useCookie<User>(STORE_KEY_MIDDLEWARE, { watch: true })

  // redirect the user to the login page
  if (!userCookie.value?.accountType || userCookie.value?.accountType !== AccountType.SELLER) {
    return navigateTo({
      path: '/',
      query: {
        redirect: to.fullPath,
      },
    })
  }
})