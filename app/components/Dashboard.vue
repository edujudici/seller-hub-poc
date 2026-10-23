<script setup lang="ts">
import { computed } from 'vue';
import {
  TrendingUp,
  DollarSign,
  Package,
  Share2,
  Truck,
  ShoppingBag,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';

const store = useCollabStore();

const metrics = computed(() => store.metrics);
const currentSeller = computed(() => store.currentSeller);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const recentSales = computed(() => {
  return store.salesAsAdvertiser.slice(0, 4);
});

const pendingFulfillments = computed(() => {
  return store.fulfillmentAsOwner.filter((o) => o.status === 'pending' || o.status === 'ready_to_ship').slice(0, 4);
});
</script>

<template>
  <div class="space-y-8">
    <!-- Top Welcome Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-indigo-500/20 p-8 shadow-xl">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <Zap class="w-3.5 h-3.5" />
            <span>Nuxt 4 BFF Server-to-Server Ativo</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Olá, {{ currentSeller.name }}!
          </h1>
          <p class="text-slate-400 text-sm max-w-xl">
            Sua conta está operando no modelo <span class="text-white font-medium">Dropshipping Colaborativo Cross-Docking</span>. Venda estoques de parceiros e permita que outros anunciem seus produtos.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="store.setActiveTab('catalog')"
            class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Share2 class="w-4 h-4" />
            Explorar Catálogo Parceiro
          </button>
          <button
            @click="store.setActiveTab('products')"
            class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-all"
          >
            <Package class="w-4 h-4" />
            Cadastrar Meu Estoque
          </button>
        </div>
      </div>

      <!-- Decorative background blur -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Vendas como Anunciante -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Transacionado</span>
          <div class="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold text-white tracking-tight">
            {{ formatCurrency(metrics.totalSalesRevenue) }}
          </div>
          <div class="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span class="text-blue-400 font-medium">{{ metrics.totalOrdersCount }} pedidos</span> gerados nos marketplaces
          </div>
        </div>
      </div>

      <!-- 2. Lucro Líquido do Anunciante -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meu Lucro (Anunciante)</span>
          <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold text-emerald-400 tracking-tight">
            {{ formatCurrency(metrics.advertiserGrossProfit) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            Spread de revenda livre de custos operacionais
          </div>
        </div>
      </div>

      <!-- 3. Repasses de Fornecimento Físico -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento (Fornecedor)</span>
          <div class="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Package class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold text-purple-400 tracking-tight">
            {{ formatCurrency(metrics.ownerFulfillmentPayout) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            Repasses a receber por produtos despachados
          </div>
        </div>
      </div>

      <!-- 4. Expedições Pendentes -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expedição Pendente</span>
          <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Truck class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold text-amber-400 tracking-tight">
            {{ metrics.pendingFulfillments }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            Itens do seu estoque aguardando envio/etiqueta
          </div>
        </div>
      </div>
    </div>

    <!-- Double Stream: Minhas Vendas vs. Minha Expedição -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Col 1: Vendas Realizadas como Anunciante -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <ShoppingBag class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">Minhas Vendas como Anunciante</h3>
                <p class="text-xs text-slate-400">Produtos de parceiros que você vendeu</p>
              </div>
            </div>
            <button
              @click="store.setActiveTab('orders')"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Ver todos <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="divide-y divide-slate-800/60 mt-4">
            <div v-if="recentSales.length === 0" class="py-8 text-center text-slate-500 text-sm">
              Nenhuma venda registrada ainda. Publique anúncios do catálogo colaborativo para começar!
            </div>
            <div
              v-for="order in recentSales"
              :key="order.id"
              class="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <div class="text-xs font-semibold text-white flex items-center gap-2">
                  <span>{{ order.id }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    {{ order.platform }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  Comprador: {{ order.buyerName }} (Qtd: {{ order.quantity }})
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-emerald-400">
                  +{{ formatCurrency(order.advertiserProfit) }}
                </div>
                <div class="text-[11px] text-slate-500">
                  Total: {{ formatCurrency(order.totalAmount) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/60">
          <button
            @click="store.setActiveTab('ads')"
            class="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Layers class="w-4 h-4" />
            Gerenciar meus {{ metrics.activeAdsCount }} anúncios ativos
          </button>
        </div>
      </div>

      <!-- Col 2: Pedidos para Despachar como Fornecedor Físico -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Truck class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">Expedição do Meu Estoque Físico</h3>
                <p class="text-xs text-slate-400">Pedidos vendidos por parceiros aguardando envio</p>
              </div>
            </div>
            <button
              @click="store.setActiveTab('orders')"
              class="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Ver todos <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="divide-y divide-slate-800/60 mt-4">
            <div v-if="pendingFulfillments.length === 0" class="py-8 text-center text-slate-500 text-sm">
              Nenhuma expedição pendente no momento. Seu estoque está 100% em dia!
            </div>
            <div
              v-for="order in pendingFulfillments"
              :key="order.id"
              class="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <div class="text-xs font-semibold text-white flex items-center gap-2">
                  <span>{{ order.id }}</span>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium"
                    :class="order.status === 'ready_to_ship' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'"
                  >
                    {{ order.status === 'ready_to_ship' ? 'Pronto p/ Envio' : 'Pendente' }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  Destino: {{ order.buyerName }} • Rastreio: {{ order.trackingNumber }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-purple-400">
                  {{ formatCurrency(order.ownerPayout) }}
                </div>
                <div class="text-[11px] text-slate-500">
                  Seu repasse de atacado
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/60">
          <button
            @click="store.setActiveTab('orders')"
            class="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Truck class="w-4 h-4" />
            Imprimir Etiquetas e Despachar Pacotes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
