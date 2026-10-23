<script setup lang="ts">
import { computed, markRaw, watch } from "vue";
import {
  LayoutDashboard,
  Package,
  Share2,
  Layers,
  ShoppingBag,
  Network,
  RotateCcw,
  UserCheck,
  ChevronDown,
} from "lucide-vue-next";
import { useCollabStore } from "~/stores/collab";

import Dashboard from "~/components/Dashboard.vue";
import CollaborativeCatalog from "~/components/CollaborativeCatalog.vue";
import MyProducts from "~/components/MyProducts.vue";
import MyAds from "~/components/MyAds.vue";
import Orders from "~/components/Orders.vue";
import Integrations from "~/components/Integrations.vue";

const store = useCollabStore();
const route = useRoute();

// OAuth provider returns to /?status=success. Open Integrations before its
// component consumes the status and displays the success notice.
watch(
  () => route.query.status,
  (status) => {
    if (status === "success" || status === "error") {
      store.setActiveTab("integrations");
    }
  },
  { immediate: true },
);

const activeTab = computed(() => store.activeTab);
const currentSeller = computed(() => store.currentSeller);
const sellers = computed(() => store.sellers);

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard Geral",
    icon: LayoutDashboard,
    component: markRaw(Dashboard),
  },
  {
    id: "catalog",
    label: "Catálogo Colaborativo",
    icon: Share2,
    component: markRaw(CollaborativeCatalog),
  },
  {
    id: "products",
    label: "Meu Estoque Físico",
    icon: Package,
    component: markRaw(MyProducts),
  },
  {
    id: "ads",
    label: "Meus Anúncios",
    icon: Layers,
    component: markRaw(MyAds),
  },
  {
    id: "orders",
    label: "Central de Pedidos",
    icon: ShoppingBag,
    component: markRaw(Orders),
  },
  {
    id: "integrations",
    label: "Integrações Marketplaces",
    icon: Network,
    component: markRaw(Integrations),
  },
] as const;

const currentTabComponent = computed(() => {
  const found = tabs.find((t) => t.id === activeTab.value);
  return found ? found.component : markRaw(Dashboard);
});
</script>

<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white"
  >
    <!-- Top Global App Bar -->
    <header
      class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20"
        >
          C
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white tracking-tight text-base"
              >CollabMarket</span
            >
            <span
              class="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md"
            >
              Nuxt 4 BFF
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            Dropshipping Colaborativo & Cross-Docking
          </p>
        </div>
      </div>

      <!-- Seller Profile Selector (Multi-Seller simulation context) -->
      <div class="flex items-center gap-3">
        <div
          class="relative flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl"
        >
          <img
            :src="currentSeller.avatar"
            :alt="currentSeller.name"
            class="w-7 h-7 rounded-full object-cover border border-slate-700"
          />
          <div class="hidden sm:block text-left text-xs">
            <div class="font-semibold text-white leading-none">
              {{ currentSeller.name }}
            </div>
            <div
              class="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]"
            >
              {{ currentSeller.storeName }}
            </div>
          </div>

          <select
            :value="currentSeller.id"
            @change="(e: any) => store.switchSeller(e.target.value)"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Alternar Perfil de Vendedor"
          >
            <option v-for="s in sellers" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.storeName }})
            </option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </div>

        <button
          @click="store.resetState()"
          class="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          title="Restaurar Dados Padrão de Demonstração"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main Navigation Tabs -->
    <nav
      class="bg-slate-900 border-b border-slate-800/80 px-4 lg:px-8 overflow-x-auto"
    >
      <div class="flex space-x-1 sm:space-x-2 py-2 min-w-max">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="store.setActiveTab(tab.id as any)"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          :class="
            activeTab === tab.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          "
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Page Content Slot -->
    <main class="flex-1 px-4 lg:px-8 py-8 max-w-7xl w-full mx-auto">
      <component :is="currentTabComponent" />
    </main>

    <!-- Footer -->
    <footer
      class="mt-auto border-t border-slate-800/60 py-4 px-8 text-center text-xs text-slate-500"
    >
      CollabMarket • Arquitetura Server-to-Server Nuxt 4 BFF (Backend for
      Frontend)
    </footer>
  </div>
</template>
