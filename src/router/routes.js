const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'auto', component: () => import('pages/AutoDrawing.vue') },
      { path: 'edit', component: () => import('pages/EditDrawing.vue') },
      { path: 'position-test', component: () => import('pages/PositionTest.vue') },
      { path: 'position-test2', component: () => import('pages/PositionTest2.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
