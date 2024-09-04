import { useUserStore } from "@/pinia/user"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore()

  // user is logged in, redirect to home page
  if (!userStore.isNotOnboarded) {
    return navigateTo({
      path: `/accounts/${userStore.accountId}`,
      query: {
        redirect: to.fullPath,
      },
    })
  }
})