<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ShoppingBag,
  Truck,
  Printer,
  CheckCircle,
  Clock,
  Send,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Package
} from 'lucide-vue-next';
import { useCollabStore } from '~/stores/collab';
import type { Order } from '~/types/collab';
import ShippingLabelModal from './ShippingLabelModal.vue';

const store = useCollabStore();

const activeFilter = ref<'all' | 'sales' | 'fulfillment'>('all');
const statusFilter = ref<string>('all');
const selectedOrderForLabel = ref<Order | null>(null);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const filteredOrders = computed(() => {
  let list = store.orders;

  if (activeFilter.value === 'sales') {
    list = list.filter((o) => o.advertiserId === store.currentSeller.id);
  } else if (activeFilter.value === 'fulfillment') {
    list = list.filter((o) => o.ownerId === store.currentSeller.id);
  } else {
    list = list.filter((o) => o.advertiserId === store.currentSeller.id || o.ownerId === store.currentSeller.id);
  }

  if (statusFilter.value !== 'all') {
    list = list.filter((o) => o.status === statusFilter.value);
  }

  return list;
});

const getProduct = (productId: string) => {
  return store.products.find((p) => p.id === productId) || null;
};

const getSeller = (sellerId: string) => {
  return store.sellers.find((s) => s.id === sellerId) || null;
};

const openLabelModal = (order: Order) => {
  selectedOrderForLabel.value = order;
};

const markAsShipped = async (orderId: string) => {
  const trackingCode = `BR-POST-${Math.floor(100000000 + Math.random() * 900000000)}`;
  await store.updateOrderStatus(orderId, 'shipped', trackingCode);
};

const markAsReady = async (orderId: string) => {
  await store.updateOrderStatus(orderId, 'ready_to_ship');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShoppingBag class="w-6 h-6 text-emerald-400" />
          Central de Pedidos e Expedição
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Acompanhe suas vendas como anunciante e gerencie a expedição dos pedidos onde você é o fornecedor do estoque físico.
        </p>
      </div>
    </div>

    <!-- Filter Pills -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
      <div class="flex items-center gap-2">
        <button
          @click="activeFilter = 'all'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          :class="activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'"
        >
          Todos os Pedidos ({{ store.salesAsAdvertiser.length + store.fulfillmentAsOwner.length }})
        </button>
        <button
          @click="activeFilter = 'sales'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          :class="activeFilter === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'"
        >
          Minhas Vendas ({{ store.salesAsAdvertiser.length }})
        </button>
        <button
          @click="activeFilter = 'fulfillment'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          :class="activeFilter === 'fulfillment' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'"
        >
          Expedição do Meu Estoque ({{ store.fulfillmentAsOwner.length }})
        </button>
      </div>

      <div>
        <select
          v-model="statusFilter"
          class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="ready_to_ship">Pronto p/ Envio</option>
          <option value="shipped">Despachado / Em Trânsito</option>
          <option value="delivered">Entregue</option>
        </select>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th class="py-3.5 px-4">Pedido / Marketplace</th>
              <th class="py-3.5 px-4">Item & Comprador</th>
              <th class="py-3.5 px-4">Papel no Pedido</th>
              <th class="py-3.5 px-4">Financeiro</th>
              <th class="py-3.5 px-4">Status & Rastreio</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="o in filteredOrders" :key="o.id" class="hover:bg-slate-850/50 transition-colors">
              <!-- Pedido / Marketplace -->
              <td class="py-4 px-4 font-mono">
                <div class="font-bold text-white">{{ o.id }}</div>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    {{ o.platform }}
                  </span>
                  <span class="text-[11px] text-slate-500">{{ formatDate(o.createdAt) }}</span>
                </div>
              </td>

              <!-- Item & Comprador -->
              <td class="py-4 px-4 max-w-xs">
                <div class="font-medium text-white truncate">{{ getProduct(o.productId)?.title || 'Produto' }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  Comprador: <span class="text-slate-300">{{ o.buyerName }}</span> (Qtd: {{ o.quantity }})
                </div>
                <div class="text-[10px] text-slate-500 truncate mt-0.5" :title="o.buyerAddress">
                  {{ o.buyerAddress }}
                </div>
              </td>

              <!-- Papel no Pedido -->
              <td class="py-4 px-4">
                <div v-if="o.advertiserId === store.currentSeller.id && o.ownerId === store.currentSeller.id">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Venda Direta (Estoque Próprio)
                  </span>
                </div>
                <div v-else-if="o.advertiserId === store.currentSeller.id">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Você é o Anunciante
                  </span>
                  <div class="text-[10px] text-slate-400 mt-1">
                    Expedição: {{ getSeller(o.ownerId)?.name || 'Fornecedor' }}
                  </div>
                </div>
                <div v-else>
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Você é o Fornecedor Físico
                  </span>
                  <div class="text-[10px] text-slate-400 mt-1">
                    Vendido por: {{ getSeller(o.advertiserId)?.name || 'Parceiro' }}
                  </div>
                </div>
              </td>

              <!-- Financeiro -->
              <td class="py-4 px-4">
                <div class="text-xs text-slate-400">Total: <span class="text-slate-200 font-bold">{{ formatCurrency(o.totalAmount) }}</span></div>
                <div v-if="o.advertiserId === store.currentSeller.id" class="text-emerald-400 font-bold text-xs mt-0.5">
                  Lucro Anúncio: +{{ formatCurrency(o.advertiserProfit) }}
                </div>
                <div v-if="o.ownerId === store.currentSeller.id" class="text-purple-400 font-bold text-xs mt-0.5">
                  Repasse Fornecedor: +{{ formatCurrency(o.ownerPayout) }}
                </div>
              </td>

              <!-- Status & Rastreio -->
              <td class="py-4 px-4">
                <span
                  class="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase"
                  :class="{
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30': o.status === 'pending',
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30': o.status === 'ready_to_ship',
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': o.status === 'shipped',
                    'bg-slate-800 text-slate-400': o.status === 'delivered',
                  }"
                >
                  {{ o.status === 'pending' ? 'Pendente' : o.status === 'ready_to_ship' ? 'Pronto p/ Envio' : o.status === 'shipped' ? 'Em Trânsito' : 'Entregue' }}
                </span>
                <div v-if="o.trackingNumber" class="text-[10px] font-mono text-slate-400 mt-1">
                  Rastreio: {{ o.trackingNumber }}
                </div>
              </td>

              <!-- Ações -->
              <td class="py-4 px-4 text-right space-x-2">
                <!-- Se for dono do estoque físico e status for pendente/ready, pode imprimir e despachar -->
                <button
                  @click="openLabelModal(o)"
                  class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                  title="Visualizar Etiqueta de Envio"
                >
                  <Printer class="w-3.5 h-3.5" />
                  Etiqueta
                </button>

                <button
                  v-if="o.ownerId === store.currentSeller.id && o.status === 'pending'"
                  @click="markAsReady(o.id)"
                  class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  <CheckCircle class="w-3.5 h-3.5" />
                  Embalado
                </button>

                <button
                  v-if="o.ownerId === store.currentSeller.id && (o.status === 'pending' || o.status === 'ready_to_ship')"
                  @click="markAsShipped(o.id)"
                  class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                >
                  <Send class="w-3.5 h-3.5" />
                  Despachar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
      <ShoppingBag class="w-10 h-10 text-slate-600 mx-auto" />
      <div class="text-slate-300 font-medium">Nenhum pedido encontrado</div>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Tente ajustar seus filtros ou use a opção "Simular Venda" na aba Meus Anúncios para gerar um novo pedido.
      </p>
    </div>

    <!-- Label Modal Component -->
    <ShippingLabelModal
      :order="selectedOrderForLabel"
      :product="selectedOrderForLabel ? getProduct(selectedOrderForLabel.productId) : null"
      :owner="selectedOrderForLabel ? getSeller(selectedOrderForLabel.ownerId) : null"
      :advertiser="selectedOrderForLabel ? getSeller(selectedOrderForLabel.advertiserId) : null"
      @close="selectedOrderForLabel = null"
    />
  </div>
</template>
