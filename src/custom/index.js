// /custom plugin interface (Factory Spec §4, §6) — the AI customizer may
// only add files under src/custom/**. App.jsx imports this fixed merge
// point and never needs to change per client. Empty by default.
//
// nav: extra items appended to the sidebar/bottom-tabs, e.g.
//   { id: "loyalty", label: "Loyalty", icon: Star }
// routes: maps a nav id to the component rendered for it, e.g.
//   { loyalty: (props) => <LoyaltyView {...props} /> }
export const customNav = [];
export const customRoutes = {};
