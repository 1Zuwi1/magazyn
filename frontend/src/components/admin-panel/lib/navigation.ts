export const ADMIN_NAV_LINKS = [
  { title: "Przegląd", url: "/dashboard/admin" },
  { title: "Użytkownicy", url: "/dashboard/admin/users" },
  { title: "Magazyny", url: "/dashboard/admin/warehouses" },
]

export const ADMIN_NAV_DATA = [
  {
    title: "",
    items: ADMIN_NAV_LINKS.map((link) => ({
      title: link.title,
      url: link.url,
    })),
  },
]
