import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/players",
      name: "players",
      component: () => import("../views/PlayerListView.vue"),
    },
    {
      path: "/players/new",
      name: "player-new",
      component: () => import("../views/PlayerFormView.vue"),
    },
    {
      path: "/players/:id/edit",
      name: "player-edit",
      component: () => import("../views/PlayerFormView.vue"),
    },
    {
      path: "/hanchans",
      name: "hanchans",
      component: () => import("../views/HanchanListView.vue"),
    },
    {
      path: "/hanchans/new",
      name: "hanchan-new",
      component: () => import("../views/HanchanFormView.vue"),
    },
    {
      path: "/hanchans/:id/edit",
      name: "hanchan-edit",
      component: () => import("../views/HanchanFormView.vue"),
    },
    {
      path: "/hanchans/:hanchanId/rounds",
      name: "rounds",
      component: () => import("../views/RoundManageView.vue"),
    },
    {
      path: "/sessions",
      name: "sessions",
      component: () => import("../views/SessionListView.vue"),
    },
    {
      path: "/sessions/new",
      name: "session-new",
      component: () => import("../views/SessionFormView.vue"),
    },
    {
      path: "/sessions/:id",
      name: "session-detail",
      component: () => import("../views/SessionDetailView.vue"),
    },
    {
      path: "/sessions/:id/edit",
      name: "session-edit",
      component: () => import("../views/SessionFormView.vue"),
    },
  ],
});

export default router;
