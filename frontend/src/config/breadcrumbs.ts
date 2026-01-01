import type { RouteLocationNormalized } from "vue-router";

export interface BreadcrumbItem {
  title: string;
  to?: string;
  disabled?: boolean;
}

export type BreadcrumbConfig = BreadcrumbItem[] | ((route: RouteLocationNormalized) => BreadcrumbItem[]);

const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  home: [{ title: "ホーム" }],
  about: [{ title: "ホーム", to: "/" }, { title: "About" }],
  players: [{ title: "ホーム", to: "/" }, { title: "参加者一覧" }],
  "player-new": [
    { title: "ホーム", to: "/" },
    { title: "参加者一覧", to: "/players" },
    { title: "参加者登録" },
  ],
  "player-edit": [
    { title: "ホーム", to: "/" },
    { title: "参加者一覧", to: "/players" },
    { title: "参加者編集" },
  ],
  hanchans: [{ title: "ホーム", to: "/" }, { title: "半荘一覧" }],
  "hanchan-new": [
    { title: "ホーム", to: "/" },
    { title: "半荘一覧", to: "/hanchans" },
    { title: "半荘登録" },
  ],
  "hanchan-edit": [
    { title: "ホーム", to: "/" },
    { title: "半荘一覧", to: "/hanchans" },
    { title: "半荘編集" },
  ],
  rounds: (route: RouteLocationNormalized) => {
    const hanchanId = route.params.hanchanId as string;
    return [
      { title: "ホーム", to: "/" },
      { title: "半荘一覧", to: "/hanchans" },
      { title: "局管理", to: `/hanchans/${hanchanId}/rounds` },
    ];
  },
  sessions: [{ title: "ホーム", to: "/" }, { title: "セッション一覧" }],
  "session-new": [
    { title: "ホーム", to: "/" },
    { title: "セッション一覧", to: "/sessions" },
    { title: "セッション登録" },
  ],
  "session-detail": (route: RouteLocationNormalized) => {
    const sessionId = route.params.id as string;
    return [
      { title: "ホーム", to: "/" },
      { title: "セッション一覧", to: "/sessions" },
      { title: "セッション詳細", to: `/sessions/${sessionId}` },
    ];
  },
  "session-edit": (route: RouteLocationNormalized) => {
    const sessionId = route.params.id as string;
    return [
      { title: "ホーム", to: "/" },
      { title: "セッション一覧", to: "/sessions" },
      { title: "セッション詳細", to: `/sessions/${sessionId}` },
      { title: "セッション編集" },
    ];
  },
};

export function getBreadcrumbs(routeName: string, route: RouteLocationNormalized): BreadcrumbItem[] {
  const config = breadcrumbConfig[routeName];
  if (!config) {
    return [{ title: "ホーム", to: "/" }];
  }

  if (typeof config === "function") {
    return config(route);
  }

  return config;
}

