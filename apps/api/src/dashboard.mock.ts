import type { Dashboard } from "@starter/shared";
export const dashboardMock: Dashboard = {
  registrations: [
    { day: "Senin", count: 24 },
    { day: "Selasa", count: 31 },
    { day: "Rabu", count: 28 },
    { day: "Kamis", count: 42 },
    { day: "Jumat", count: 36 },
    { day: "Sabtu", count: 18 },
    { day: "Minggu", count: 21 },
  ],
  activeUsers: 176,
  inactiveUsers: 24,
};
